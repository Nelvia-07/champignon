import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { MoodNote, Tag, MoodType } from '../models';

const db = SQLite.openDatabaseSync('mood_tree_hole.db');

export const initDatabase = () => {
    db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      moodType TEXT,
      isFollowUp INTEGER DEFAULT 0,
      parentId TEXT,
      images TEXT
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_name TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_name),
      FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS preset_tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

    // Populate default settings
    db.runSync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['inputAreaDefaultState', 'collapsed']);

    // Populate default tags if empty
    const count = db.getFirstSync('SELECT COUNT(*) as count FROM preset_tags') as any;
    if (count.count === 0) {
        const defaults = [
            { name: '理财', color: '#FFD580' },
            { name: '工作', color: '#B0DAFF' },
            { name: '生活', color: '#C1E1C1' },
            { name: '学习', color: '#D4C1EC' },
            { name: '运动', color: '#FFABAB' }
        ];
        defaults.forEach(tag => {
            db.runSync('INSERT INTO preset_tags (id, name, color) VALUES (?, ?, ?)', [Crypto.randomUUID(), tag.name, tag.color]);
        });
    }

    // Migration: Check if 'images' column exists, add it if not
    try {
        const tableInfo = db.getAllSync('PRAGMA table_info(notes)') as any[];
        const hasImagesColumn = tableInfo.some(col => col.name === 'images');
        if (!hasImagesColumn) {
            db.execSync('ALTER TABLE notes ADD COLUMN images TEXT');
        }
    } catch (e) {
        console.error('Migration error:', e);
    }

    // Migration: Add color to preset_tags
    try {
        const tableInfo = db.getAllSync('PRAGMA table_info(preset_tags)') as any[];
        const hasColorColumn = tableInfo.some(col => col.name === 'color');
        if (!hasColorColumn) {
            db.execSync('ALTER TABLE preset_tags ADD COLUMN color TEXT');
            // Backfill default colors for existing tags?
            // Optional: db.runSync("UPDATE preset_tags SET color = '#FFD580' WHERE name = '理财' AND color IS NULL");
        }
    } catch (e) {
        console.error('Migration error (preset_tags):', e);
    }
};

// Note: Call initDatabase() from a useEffect in your root component


export const saveNote = (note: MoodNote) => {
    db.runSync(
        'INSERT INTO notes (id, content, timestamp, moodType, isFollowUp, parentId, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [note.id, note.content, note.timestamp, note.moodType, note.isFollowUp ? 1 : 0, note.parentId || null, note.images ? JSON.stringify(note.images) : null]
    );

    note.tags.forEach(tagName => {
        db.runSync('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [Crypto.randomUUID(), tagName]);
        db.runSync('INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)', [note.id, tagName]);
    });
};

export const getAllNotes = (): MoodNote[] => {
    const rows = db.getAllSync('SELECT * FROM notes ORDER BY timestamp DESC') as any[];
    return rows.map(row => {
        const tags = db.getAllSync('SELECT tag_name FROM note_tags WHERE note_id = ?', [row.id]) as any[];
        return {
            ...row,
            isFollowUp: !!row.isFollowUp,
            tags: tags.map(t => t.tag_name),
            moodType: row.moodType as MoodType,
            images: row.images ? JSON.parse(row.images) : []
        };
    });
};

export const deleteNotes = (ids: string[]) => {
    const placeholders = ids.map(() => '?').join(',');
    db.runSync(`DELETE FROM notes WHERE id IN (${placeholders})`, ids);
};

export const updateNoteTags = (noteIds: string[], newTags: string[]) => {
    const placeholders = noteIds.map(() => '?').join(',');

    // Overwrite mode: delete old then add new
    db.runSync(`DELETE FROM note_tags WHERE note_id IN (${placeholders})`, noteIds);

    noteIds.forEach(noteId => {
        newTags.forEach(tagName => {
            db.runSync('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [Crypto.randomUUID(), tagName]);
            db.runSync('INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)', [noteId, tagName]);
        });
    });
};

export const updateNoteContent = (id: string, newContent: string) => {
    db.runSync('UPDATE notes SET content = ? WHERE id = ?', [newContent, id]);
};

export const updateNoteMood = (id: string, mood: MoodType) => {
    db.runSync('UPDATE notes SET moodType = ? WHERE id = ?', [mood, id]);
};

export const updateNoteMoodAndTags = (id: string, mood: MoodType, tags: string[]) => {
    db.runSync('UPDATE notes SET moodType = ? WHERE id = ?', [mood, id]);

    // Clear old tags for this note
    db.runSync('DELETE FROM note_tags WHERE note_id = ?', [id]);

    // Insert new tags
    tags.forEach(tagName => {
        db.runSync('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)', [Crypto.randomUUID(), tagName]);
        db.runSync('INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)', [id, tagName]);
    });
};

export const getAISettings = (): { provider: string, geminiApiKey: string, deepseekApiKey: string, deepseekModel: string, customPrompt: string } => {
    const rows = db.getAllSync('SELECT * FROM settings') as any[];
    const settings: any = {
        provider: 'llama',
        geminiApiKey: '',
        deepseekApiKey: '',
        deepseekModel: 'deepseek-chat',
        customPrompt: ''
    };
    rows.forEach(row => {
        settings[row.key] = row.value;
    });
    return settings;
};

export const updateAISettings = (key: string, value: string) => {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

export const getGeneralSettings = (): { inputAreaDefaultState: 'collapsed' | 'expanded' } => {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['inputAreaDefaultState']) as any;
    return {
        inputAreaDefaultState: (row?.value as 'collapsed' | 'expanded') || 'collapsed'
    };
};

export const updateGeneralSetting = (key: string, value: string) => {
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

export const getNoteById = (id: string): MoodNote | null => {
    const row = db.getFirstSync('SELECT * FROM notes WHERE id = ?', [id]) as any;
    if (!row) return null;
    const tags = db.getAllSync('SELECT tag_name FROM note_tags WHERE note_id = ?', [id]) as any[];
    return {
        ...row,
        isFollowUp: !!row.isFollowUp,
        tags: tags.map(t => t.tag_name),
        moodType: row.moodType as MoodType,
        images: row.images ? JSON.parse(row.images) : []
    };
};

export const getAllPresetTags = (): Tag[] => {
    const rows = db.getAllSync('SELECT id, name, color FROM preset_tags ORDER BY name ASC') as any[];
    return rows.map(r => ({ id: r.id, name: r.name, color: r.color }));
};

export const addPresetTag = (name: string, color?: string) => {
    db.runSync('INSERT OR IGNORE INTO preset_tags (id, name, color) VALUES (?, ?, ?)', [Crypto.randomUUID(), name, color || null]);
};

export const deletePresetTag = (name: string) => {
    db.runSync('DELETE FROM preset_tags WHERE name = ?', [name]);
};

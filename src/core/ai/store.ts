type AIStatus = 'IDLE' | 'DOWNLOADING' | 'READY' | 'BUSY' | 'ERROR';

interface AIState {
    status: AIStatus;
    progress: number;
    error: string | null;
    mirror?: string;
    detail?: string;
    analyzingNoteId?: string | null;
}

type Listener = (state: AIState) => void;

class AIStore {
    private state: AIState = {
        status: 'IDLE',
        progress: 0,
        error: null,
        mirror: '',
        detail: '',
    };
    private listeners = new Set<Listener>();

    getState() {
        return this.state;
    }

    setState(newState: Partial<AIState>) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(l => l(this.state));
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
}

export const aiStore = new AIStore();

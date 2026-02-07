const { withGradleProperties, withProjectBuildGradle } = require('@expo/config-plugins');

const withAndroidJetifier = (config) => {
    // 1. Set gradle properties
    config = withGradleProperties(config, (config) => {
        config.modResults.push({
            type: 'property',
            key: 'android.enableJetifier',
            value: 'true',
        });
        config.modResults.push({
            type: 'property',
            key: 'android.useAndroidX',
            value: 'true',
        });
        return config;
    });

    // 2. Aggressively exclude support-compat to fix Duplicate classes error
    config = withProjectBuildGradle(config, (config) => {
        if (config.modResults.contents.includes('exclude group: "com.android.support"')) {
            return config;
        }

        const exclusionBlock = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.core:core:1.13.1'
        }
        exclude group: "com.android.support", module: "support-compat"
        exclude group: "com.android.support", module: "support-v4"
    }
}
`;
        config.modResults.contents += exclusionBlock;
        return config;
    });

    return config;
};

module.exports = withAndroidJetifier;

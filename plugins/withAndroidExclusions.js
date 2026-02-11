const { withProjectBuildGradle } = require('@expo/config-plugins');

const withAndroidExclusions = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.contents.includes('exclude group: "com.android.support"')) {
            return config;
        }

        const exclusionBlock = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.core:core:1.13.1'
            force 'androidx.appcompat:appcompat:1.6.1'
            force 'androidx.fragment:fragment:1.7.1'
            force 'androidx.annotation:annotation:1.8.0'
            force 'androidx.lifecycle:lifecycle-common:2.8.3'
            force 'androidx.lifecycle:lifecycle-runtime:2.8.3'
            force 'androidx.work:work-runtime:2.9.0'
        }
        exclude group: "com.android.support"
        exclude group: "org.jetbrains.kotlin", module: "kotlin-stdlib-jdk8"
        exclude group: "org.jetbrains.kotlin", module: "kotlin-stdlib-jdk7"
    }
}
`;
        config.modResults.contents += exclusionBlock;
        return config;
    });
};

module.exports = withAndroidExclusions;

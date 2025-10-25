
export const getAppVersion = async (req, res) => {
    try {

        const { currentVersion, platform } = req.query;

        console.log(currentVersion, platform);

        const versionInfo = {
            minimumVersion: "1.2.0",
            latestVersion: "1.3.0",
            forceUpdate: false,
            updateMessage: "A new version is available with important bug fixes and improvements. Please update to continue using the app.",

            maintenanceMode: false,
            maintenanceMessage: ""
        }

        if (currentVersion === "1.0.0" || currentVersion === "1.0.0") {
            versionInfo.forceUpdate = true;
            versionInfo.minimumVersion = "1.0.0";
            versionInfo.updateMessage = "Critical bug fix required. Please update immediately to continue using the app.";
        }

        if (platform === "ios") {
            versionInfo.latestVersion = "1.3.1";
        } else if (platform === "android") {
            versionInfo.latestVersion = "1.3.0";
        }

        console.log(`Version check: User on ${platform} ${currentVersion}, Latest: ${versionInfo.latestVersion}`);

        res.status(200).json(versionInfo);

        console.log(versionInfo);


    } catch (error) {

        console.error("Error in getAppVersionAdvanced controller:", error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}
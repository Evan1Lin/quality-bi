import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";

const config: ForgeConfig = {
  packagerConfig: {
    name: "QualityBI",
    executableName: "QualityBI",
    asar: true,
    // icon: "./assets/icon", // uncomment after adding icon files
    appVersion: "1.0.0",
    appCopyright: `Copyright © ${new Date().getFullYear()}`,
    // Ignore unnecessary files from packaging
    ignore: [
      /^\/\.git/,
      /^\/\.env/,
      /^\/\.gemini/,
      /^\/out/,
      /^\/quality-intelligence-bi\.zip$/,
      /^\/\.gitignore$/,
      /^\/README\.md$/,
      /^\/metadata\.json$/,
      /^\/\.env\.example$/,
    ],
  },
  makers: [
    new MakerSquirrel({
      name: "QualityBI",
      setupExe: "QualityBI-Setup.exe",
      // iconUrl and setupIcon can be set after adding icon files
    }),
    new MakerZIP({}, ["darwin", "linux", "win32"]),
    new MakerDeb({
      options: {
        name: "quality-bi",
        productName: "质量智能 BI",
        maintainer: "Quality BI Team",
        description: "A professional quality management dashboard for manufacturing decision support.",
        categories: ["Utility", "Office"],
      },
    }),
  ],
  plugins: [],
};

export default config;

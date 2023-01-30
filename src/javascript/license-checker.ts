import { NodeProject } from "./node-project";
import { Component } from "../component";

/**
 * Options to configure the license checker
 */
export interface LicenseCheckerOptions {
  /**
   * Check production dependencies.
   * @default true
   */
  readonly production?: boolean;

  /**
   * Check development dependencies.
   * @default false
   */
  readonly development?: boolean;

  /**
   * List of SPDX license identifiers that are allowed to be used.
   *
   * For the license check to pass, all detected licenses MUST be in this list.
   * Only one of `allowedLicenses` and `prohibitedLicenses` can be provided and must not be empty.
   * @default - no licenses are allowed
   */
  readonly allowedLicenses?: string[];

  /**
   * List of SPDX license identifiers that are prohibited to be used.
   *
   * For the license check to pass, no detected licenses can be in this list.
   * Only one of `allowedLicenses` and `prohibitedLicenses` can be provided and must not be empty.
   * @default - no licenses are prohibited
   */
  readonly prohibitedLicenses?: string[];
}

/**
 * Enforces allowed licenses used by dependencies.
 */
export class LicenseChecker extends Component {
  public constructor(project: NodeProject, options: LicenseCheckerOptions) {
    super(project);

    const {
      production = true,
      development = false,
      allowedLicenses = [],
      prohibitedLicenses = [],
    } = options;

    if (!production && !development) {
      throw new Error(
        "LicenseChecker: At least one of `production` or `development` must be enabled."
      );
    }
    if (!allowedLicenses.length && !prohibitedLicenses.length) {
      throw new Error(
        "LicenseChecker: Neither `allowedLicenses` nor `prohibitedLicenses` found. Exactly one must be provided and not empty."
      );
    }
    if (allowedLicenses.length && prohibitedLicenses.length) {
      throw new Error(
        "LicenseChecker: `allowedLicenses` and `prohibitedLicenses` can not be used at the same time. Choose one or the other."
      );
    }

    const cmd = ["license-checker", "--summary"];

    if (production && !development) {
      cmd.push("--production");
    }
    if (development && !production) {
      cmd.push("--development");
    }
    if (allowedLicenses.length) {
      cmd.push("--onlyAllow");
      cmd.push(`"${allowedLicenses.join(";")}"`);
    }
    if (prohibitedLicenses.length) {
      cmd.push("--failOn");
      cmd.push(`"${prohibitedLicenses.join(";")}"`);
    }

    project.addDevDeps("license-checker");
    const task = project.addTask("check-licenses", {
      exec: cmd.join(" "),
      receiveArgs: true,
    });
    project.preCompileTask.spawn(task);
  }
}

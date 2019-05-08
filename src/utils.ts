import * as http from "http";
import * as querystring from "querystring";

import { URLType } from "./Types";

interface HETSApiOptions {
  readonly hostname: string;
  readonly port?: number;
  readonly path: string;
}

export class Utils {
  public static constructURL(
    hostname: string,
    port: number,
    filepath: string,
    type: URLType,
    command_list: string
  ): string {
    let escapedURL = "";
    let path = "";

    if (type === URLType.File) {
      escapedURL = querystring.escape("file:///" + filepath);
      path = `/dg/${escapedURL}/${command_list}?format=json`;

      return `http://${hostname}:${port}${path}`;
    } else if (type === URLType.Web) {
      escapedURL = querystring.escape(filepath);
      path = `/dg/${escapedURL}/?format=json`;

      return hostname + path;
    } else {
      console.warn("Got URL of unsupported type!");
      return "";
    }
  }

  public static async queryHETSApi(
    hostname: string,
    port: number,
    filepath: string,
    type: URLType,
    command_list: string
  ): Promise<JSON> {
    let escapedURL = "";
    let hetsApiOptions: HETSApiOptions;
    if (type === URLType.File) {
      escapedURL = querystring.escape("file:///" + filepath);
      hetsApiOptions = {
        hostname: hostname,
        port: port,
        path: `/dg/${escapedURL}/${command_list}?format=json`
      };
    } else if (type === URLType.Web) {
      escapedURL = querystring.escape(filepath);
      hetsApiOptions = {
        hostname: hostname,
        path: `/dg/${escapedURL}/?format=json`
      };
    } else {
      console.warn("Got URL of unsupported type!");
    }

    console.log(hetsApiOptions);

    try {
      return await this.getJSON(hetsApiOptions);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Executes a standard GET request but returns a promise.
   * @param _options Object containing request parameters.
   */
  private static getJSON(options: HETSApiOptions): Promise<JSON> {
    return new Promise<JSON>((resolve, reject: (reason?: Error) => void) => {
      http
        .get(options, res => {
          const { statusCode } = res;
          const contentType = res.headers["content-type"];

          let error: Error;
          if (statusCode !== 200) {
            error = new Error(statusCode.toString());
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error(
              `Invalid content-type. Expected application/json but received ${contentType}`
            );
          }
          if (error) {
            // consume response data to free up memory
            res.resume();
            reject(error);
          }

          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", chunk => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (err) {
              reject(err);
            }
          });
        })
        .on("error", err => {
          reject(err);
        });
    });
  }
}

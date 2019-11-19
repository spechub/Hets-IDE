import * as http from "http";
import * as querystring from "querystring";
import * as request from "request-promise-native";

interface HetsAPIOptions {
  readonly hostname: string;
  readonly port?: number;
  readonly path: string;
}

enum HetsAPICommand {
  DecisionGraph,
  Theory,
  Translations,
  Provers,
  Prove,
  ConsistencyCheckers,
  ConsistencyCheck,
  Version,
  Filetype
}

export class HetsRESTInterface {
  private hostname: string;
  private port: number;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
  }

  public async getDecisionGraph(
    filepath: string,
    command_list: string
  ): Promise<JSON> {
    let escapedURL = "";
    let hetsApiOptions: HetsAPIOptions;

    // if (type === URLType.File) {
    escapedURL = querystring.escape("file:///" + filepath);
    hetsApiOptions = {
      hostname: this.hostname,
      port: this.port,
      path: `/dg/${escapedURL}/${command_list}?format=json`
    };
    // } else if (type === URLType.Web) {
    //   escapedURL = querystring.escape(filepath);
    //   hetsApiOptions = {
    //     hostname: this.hostname,
    //     path: `/dg/${escapedURL}/?format=json`
    //   };
    // } else {
    //   console.warn("Got URL of unsupported type!");
    // }

    console.log(hetsApiOptions);

    try {
      return await this.getJSON(hetsApiOptions);
    } catch (err) {
      throw err;
    }
  }

  public async getComorphisms(
    filepath: string,
    node: string | null,
    commandList: string | null
  ): Promise<JSON> {
    const escapedURL = querystring.escape("file:///" + filepath);
    const commandListPart = commandList !== null ? `/${commandList}` : "";
    const nodePart = node !== null ? `&node=${node}` : "";

    const hetsApiOptions = {
      hostname: this.hostname,
      port: this.port,
      path: `/translations/${escapedURL}${commandListPart}?format=json${nodePart}`
    };

    try {
      return await this.getJSON(hetsApiOptions);
    } catch (err) {
      throw err;
    }
  }

  public async getProvers(
    filepath: string,
    commandList: string | null,
    node: string | null,
    comorphism: string | null
  ): Promise<JSON> {
    const escapedURL = querystring.escape("file:///" + filepath);

    const nodePart = node !== null ? `&node=${querystring.escape(node)}` : "";
    const commandListPart = commandList !== null ? `/${commandList}` : "";
    const comorphismPart =
      comorphism !== null
        ? `&translation=${querystring.escape(comorphism)}`
        : "";

    const hetsApiOptions = {
      hostname: this.hostname,
      port: this.port,
      path: `/provers/${escapedURL}${commandListPart}?format=json${nodePart}${comorphismPart}`
    };

    console.log(hetsApiOptions);

    try {
      return await this.getJSON(hetsApiOptions);
    } catch (err) {
      throw err;
    }
  }

  public async prove(
    filepath: string,
    commandList: string | null,
    node: string,
    prover: string | null,
    timeout: number,
    comorphism: string
  ) {
    const escapedURL = querystring.escape("file:///" + filepath);
    const commandListPart = commandList !== null ? `/${commandList}` : "";

    const options: request.Options = {
      url: `http://${this.hostname}:${this.port}/prove/${escapedURL}${commandListPart}`,
      method: "POST",
      json: true,
      body: {
        format: "json",
        goals: [
          {
            node: querystring.escape(node),
            reasonerConfiguration: {
              timeLimit: timeout,
              reasoner: prover
            }
          }
        ]
      }
    };

    try {
      return await request(options);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Executes a standard GET request but returns a promise.
   * @param _options Object containing request parameters.
   */
  private getJSON(options: HetsAPIOptions): Promise<JSON> {
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

import { Container } from "r2-shared-js/dist/es8-es2017/src/parser/epub/container";
import { OPF } from "r2-shared-js/dist/es8-es2017/src/parser/epub/opf";


export default abstract class Epub {

  constructor(
    private readonly containerXmlPath: string,
    public readonly folderPath: string,
    public readonly container: Container,
    public readonly opf: OPF,
    public readonly ncx: Document | undefined
  ) {
  }

  public static async build<T extends Epub>(containerXmlPath: string): Promise<T> {
    throw new Error("The `build` method must be overrridden by the concrete class extending Epub.")
  }

  abstract getFileStr(path: string): Promise<string>
  abstract getBuffer(path: string): Promise<Buffer>
}

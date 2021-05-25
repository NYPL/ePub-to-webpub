import { Container } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/container';
import { OPF } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/opf';
import { NCX } from 'r2-shared-js/dist/es8-es2017/src/parser/epub/ncx';

export default abstract class Epub {
  constructor(
    private readonly containerXmlPath: string,
    public readonly folderPath: string,
    public readonly container: Container,
    public readonly opf: OPF,
    public readonly ncx: NCX | undefined
  ) {}

  public static async build(containerXmlPath: string): Promise<Epub> {
    throw new Error(
      'The `build` method must be overrridden by the concrete class extending Epub.'
    );
  }

  abstract getFullHref(path: string): string;
  abstract getFileStr(path: string): Promise<string>;
}

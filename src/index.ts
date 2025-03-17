import * as fs from "node:fs";
import * as path from "node:path";
import { glob } from "glob";
import { zerox } from "zerox";

export interface ZeroxOptions {
  filePath: string;
  credentials: {
    apiKey: string;
  };
  outputDir: string;
  cleanup?: boolean;
  concurrency?: number;
  maintainFormat?: boolean;
  model?: string;
  prompt?: string;
}

export interface ConversionResult {
  success: boolean;
  filePath: string;
  error?: string;
}

export class DocumentConverter {
  private supportedExtensions: string[];

  constructor() {
    this.supportedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".odt",
      ".ott",
      ".rtf",
      ".txt",
      ".html",
      ".htm",
      ".xml",
      ".csv",
      ".tsv",
      ".ppt",
      ".pptx",
      ".odp",
      ".otp",
    ];
  }

  /**
   * 指定されたディレクトリ内の変換可能なファイルを検索します
   */
  public findConvertibleFiles(dir: string): string[] {
    const files: string[] = [];

    // globを使用して再帰的にファイルを検索
    const allFiles = glob.sync(`${dir}/**/*`, { nodir: true });

    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      if (this.supportedExtensions.includes(ext)) {
        files.push(file);
      }
    }

    return files;
  }

  /**
   * 単一のファイルをMarkdownに変換します
   */
  public async convertFile(
    filePath: string,
    outputDir: string,
    apiKey: string,
    baseInputDir: string
  ): Promise<ConversionResult> {
    try {
      // 元のファイル名を取得（拡張子なし）
      const originalFileName = path.basename(filePath, path.extname(filePath));

      // 元のディレクトリ構造を取得
      const relativePath = path.relative(baseInputDir, path.dirname(filePath));

      // 出力先のディレクトリパスを作成
      const targetOutputDir = path.join(outputDir, relativePath);

      // 出力先ディレクトリが存在しない場合は作成
      fs.mkdirSync(targetOutputDir, { recursive: true });

      const options: ZeroxOptions = {
        filePath: filePath,
        credentials: {
          apiKey: apiKey,
        },
        outputDir: targetOutputDir,
        cleanup: true,
        concurrency: 10,
        maintainFormat: false,
        model: "gpt-4o-mini",
        prompt:
          "Convert the document to clean, well-formatted Markdown. Use standard Markdown syntax for tables, headings, lists, and other elements. Do not include HTML tags.",
      };

      // ZeroXを実行
      const result = await zerox(options);

      // 出力されたファイルを探す
      const outputFiles = fs
        .readdirSync(targetOutputDir)
        .filter((file) => file.endsWith(".md"));

      if (outputFiles.length > 0) {
        // 最新のファイルを取得（複数ある場合）
        const latestFile = outputFiles.sort((a, b) => {
          const statA = fs.statSync(path.join(targetOutputDir, a));
          const statB = fs.statSync(path.join(targetOutputDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        })[0];

        // 元のファイル名でリネーム
        const oldPath = path.join(targetOutputDir, latestFile);
        const newPath = path.join(targetOutputDir, `${originalFileName}.md`);

        // 同名ファイルが既に存在する場合は削除
        if (fs.existsSync(newPath) && oldPath !== newPath) {
          fs.unlinkSync(newPath);
        }

        // ファイル名を変更
        if (oldPath !== newPath) {
          fs.renameSync(oldPath, newPath);
        }
      }

      return {
        success: true,
        filePath: filePath,
      };
    } catch (error) {
      return {
        success: false,
        filePath: filePath,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 指定されたディレクトリ内のすべての変換可能なファイルを変換します
   */
  public async convertFiles(
    inputDir: string,
    outputDir: string,
    apiKey: string | undefined
  ): Promise<ConversionResult[]> {
    const files = this.findConvertibleFiles(inputDir);
    const results: ConversionResult[] = [];

    // 出力ディレクトリを作成
    fs.mkdirSync(outputDir, { recursive: true });

    // 各ファイルを変換
    for (const file of files) {
      if (!apiKey) {
        results.push({
          success: false,
          filePath: file,
          error: "APIキーが設定されていません",
        });
        continue;
      }
      const result = await this.convertFile(file, outputDir, apiKey, inputDir);
      results.push(result);
    }

    return results;
  }
}

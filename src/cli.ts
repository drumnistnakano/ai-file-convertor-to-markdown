#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { format } from "date-fns";
import chalk from "chalk";
import { DocumentConverter } from "./index";
import dotenv from "dotenv";

// 環境変数を読み込む
dotenv.config();

// OpenAI APIキーを取得
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(chalk.red("エラー: OPENAI_API_KEYが設定されていません。"));
  console.error(chalk.yellow("以下のいずれかの方法で設定してください:"));
  console.error("1. .envファイルにOPENAI_API_KEY=your_api_keyを追加");
  console.error("2. 環境変数としてOPENAI_API_KEYを設定");
  process.exit(1);
}

async function main() {
  // コマンドライン引数を取得
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(chalk.red("エラー: 入力ディレクトリが指定されていません。"));
    console.error(chalk.yellow("使用方法: ai-ocr-convert <入力ディレクトリ>"));
    process.exit(1);
  }

  const inputDir = args[0];

  // 入力ディレクトリが存在するか確認
  if (!fs.existsSync(inputDir)) {
    console.error(
      chalk.red(`エラー: 指定されたディレクトリ "${inputDir}" が存在しません。`)
    );
    process.exit(1);
  }

  // 入力ディレクトリの絶対パスを取得
  const absoluteInputDir = path.resolve(inputDir);

  // 出力ディレクトリを作成（入力ディレクトリと同じ階層に日付付きで）
  const parentDir = path.dirname(absoluteInputDir);
  const dirName = path.basename(absoluteInputDir);
  const timestamp = format(new Date(), "yyyyMMddHHmmss");
  const outputDirName = `${dirName}_${timestamp}`;
  const outputDir = path.join(parentDir, outputDirName);

  console.log(chalk.blue("処理を開始します..."));
  console.log(chalk.blue(`入力ディレクトリ: ${absoluteInputDir}`));
  console.log(chalk.blue(`出力ディレクトリ: ${outputDir}`));

  // ドキュメント変換クラスのインスタンスを作成
  const converter = new DocumentConverter();

  try {
    // 変換可能なファイルを検索
    const files = converter.findConvertibleFiles(absoluteInputDir);

    if (files.length === 0) {
      console.log(chalk.yellow("変換可能なファイルが見つかりませんでした。"));
      process.exit(0);
    }

    console.log(
      chalk.green(`${files.length}個の変換可能なファイルが見つかりました。`)
    );

    // 出力ディレクトリを作成
    fs.mkdirSync(outputDir, { recursive: true });

    // ファイルを変換
    const results = await converter.convertFiles(
      absoluteInputDir,
      outputDir,
      apiKey
    );

    // 結果を表示
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    console.log(
      chalk.green(
        `変換完了: ${successCount}/${results.length}ファイルが正常に変換されました。`
      )
    );

    if (failCount > 0) {
      console.log(chalk.yellow(`${failCount}ファイルの変換に失敗しました:`));
      for (const r of results.filter((r) => !r.success)) {
        console.log(chalk.red(`- ${r.filePath}: ${r.error}`));
      }
    }

    console.log(chalk.green(`出力ディレクトリ: ${outputDir}`));
  } catch (error) {
    console.error(chalk.red("エラーが発生しました:"));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red("予期せぬエラーが発生しました:"));
  console.error(error);
  process.exit(1);
});

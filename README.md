# AI OCR Markdown Convertor

AI を活用してさまざまな形式のドキュメントを Markdown に変換するツール。

## 特徴

- 複数のファイル形式をサポート（PDF、Word、Excel、など）
- OpenAI の GPT-4 Vision モデルを使用
- ドキュメントの構造を保持した Markdown 変換
- 日本語を含む多言語対応

## インストール

### 必要条件

- Node.js 20 以上
- OpenAI API Key

### インストール方法

```bash
# npmからグローバルにインストール
npm install -g ai-ocr-markdown-convertor

# または、スコープ付きパッケージの場合
npm install -g @drumnistnakano/ai-ocr-markdown-convertor

# または、リポジトリからクローンして使用する場合
git clone https://github.com/yourusername/ai-ocr-markdown-convertor.git
cd ai-ocr-markdown-convertor
npm install
npm run build
npm link
```

## 使用方法

### API キーの設定

以下のいずれかの方法で OpenAI API キーを設定してください：

1. 環境変数として設定

```bash
export OPENAI_API_KEY=your_api_key
```

2. プロジェクトルートに`.env`ファイルを作成

```
OPENAI_API_KEY=your_api_key
```

### コマンド実行

```bash
# 指定したディレクトリ内のファイルを変換
ai-ocr-convert /path/to/input/directory
```

変換されたファイルは、入力ディレクトリと同じ階層に日付付きのディレクトリ（例：`input_directory_20240317123456`）として出力されます。元のディレクトリ構造が保持されるため、例えば `/path/to/input/directory/folder1/document.pdf` は `/path/to/input_directory_20240317123456/folder1/document.md` として出力されます。

## サポートされているファイル形式

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- OpenDocument (`.odt`, `.ott`)
- Rich Text Format (`.rtf`)
- Plain Text (`.txt`)
- HTML (`.html`, `.htm`)
- XML (`.xml`)
- CSV (`.csv`)
- TSV (`.tsv`)
- Microsoft PowerPoint (`.ppt`, `.pptx`)
- OpenDocument Presentation (`.odp`, `.otp`)

## ライセンス

MIT

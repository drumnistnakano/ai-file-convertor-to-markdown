# ai-file-convertor-to-markdown

## セットアップ

事前に[poetry](https://python-poetry.org/docs/)をインストールしておくこと。

```
poetry install
poetry shell
```

.env に OpenAI で払い出したキーを設定する

```
OPENAI_API_KEY={キーを指定}
```

## 使用方法

target ディレクトリに変換したいファイルを配置してください。

```
python convert.py --input-dir target/{フォルダ名指定}
```

実行すると、data ディレクトリに変換後のファイルが保管されます。

## サポート

サポートしているファイル拡張子は以下

- PDF: `.pdf`
- Excel: `.xlsx`, `.xls`
- Word: `.docx`, `.doc`

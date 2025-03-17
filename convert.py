import os
import pathlib
from pyzerox import zerox
import asyncio
import logging
from typing import List, Set, Tuple
from dotenv import load_dotenv
from datetime import datetime
import pytz
import argparse

# .envファイルから環境変数を読み込む
load_dotenv()

# ロギングの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# サポートするファイル拡張子
SUPPORTED_EXTENSIONS = {
    'pdf': '.pdf',
    'excel': ('.xlsx', '.xls'),
    'word': ('.docx', '.doc')
}

# モデルの設定
model = "gpt-4o-mini"  # 使用するモデルを指定
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    logger.error("OPENAI_API_KEY is not set in environment variables")
    raise ValueError("OPENAI_API_KEY is required")

# 必要に応じてカスタムシステムプロンプトを設定
custom_system_prompt = None

# 出力先ディレクトリの作成
def create_output_dir(base_dir: str) -> str:
    """出力先ディレクトリを作成する

    Args:
        base_dir: 基準となるディレクトリ

    Returns:
        str: 作成した出力先ディレクトリのパス
    """
    # スクリプトのディレクトリを取得
    script_dir = pathlib.Path(__file__).parent.absolute()
    
    # dataディレクトリを作成
    data_dir = script_dir / 'data'
    if not data_dir.exists():
        os.makedirs(data_dir)
        logger.info(f"Created data directory: {data_dir}")
    
    # 日本時間で日時を含むディレクトリ名を作成
    jst = pytz.timezone('Asia/Tokyo')
    now = datetime.now(jst)
    output_dir_name = f"converted_{now.strftime('%Y%m%d%H%M')}"
    output_dir = data_dir / output_dir_name
    
    if not output_dir.exists():
        os.makedirs(output_dir)
        logger.info(f"Created output directory: {output_dir}")
    
    return str(output_dir)

def get_file_type(file_path: str) -> str:
    """ファイルの種類を判定する

    Args:
        file_path: ファイルパス

    Returns:
        str: ファイルの種類（'pdf', 'excel', 'word', None）
    """
    ext = pathlib.Path(file_path).suffix.lower()
    for file_type, extensions in SUPPORTED_EXTENSIONS.items():
        if isinstance(extensions, str) and ext == extensions:
            return file_type
        elif isinstance(extensions, tuple) and ext in extensions:
            return file_type
    return None

async def convert_to_markdown(file_path: str, output_dir: str, preserve_structure: bool = True) -> bool:
    """各種ファイルをMarkdownに変換する

    Args:
        file_path: ファイルのパス
        output_dir: 出力先ディレクトリ
        preserve_structure: ディレクトリ構造を保持するかどうか

    Returns:
        bool: 変換が成功したかどうか
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return False

    # ファイルの種類を判定
    file_type = get_file_type(file_path)
    if not file_type:
        logger.error(f"Unsupported file type: {file_path}")
        return False

    # 元のディレクトリ構造を保持する場合
    if preserve_structure:
        # 入力ディレクトリからの相対パスを取得
        input_dir = pathlib.Path(os.path.dirname(file_path))
        rel_path = os.path.relpath(os.path.dirname(file_path), str(input_dir))
        
        # 出力先ディレクトリに同じ構造を作成
        target_dir = os.path.join(output_dir, rel_path)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
    else:
        target_dir = output_dir

    # 既に変換済みかどうかを確認
    filename = os.path.basename(file_path)
    md_filename = os.path.splitext(filename)[0] + ".md"
    md_path = os.path.join(target_dir, md_filename)
    
    if os.path.exists(md_path):
        logger.info(f"Markdown file already exists, skipping: {md_path}")
        return True

    try:
        # ファイルをMarkdownに変換
        logger.info(f"Converting {file_type.upper()} to Markdown: {file_path}")
        await zerox(
            file_path=file_path,
            model=model,
            output_dir=target_dir,
            custom_system_prompt=custom_system_prompt,
            select_pages=None  # すべてのページを処理
        )
        logger.info(f"Conversion completed: {file_path} -> {md_path}")
        return True
    except Exception as e:
        logger.error(f"Error converting file to Markdown: {file_path}, Error: {str(e)}")
        return False

def find_convertible_files(root_dir: str) -> List[pathlib.Path]:
    """指定されたディレクトリ内のすべての対応ファイルを再帰的に検索する

    Args:
        root_dir: 検索対象のルートディレクトリ

    Returns:
        List[pathlib.Path]: 見つかったファイルのパスのリスト
    """
    root_path = pathlib.Path(root_dir)
    files = []

    # すべての対応拡張子を取得
    all_extensions = []
    for extensions in SUPPORTED_EXTENSIONS.values():
        if isinstance(extensions, str):
            all_extensions.append(extensions)
        else:
            all_extensions.extend(extensions)

    # ファイルを検索
    for ext in all_extensions:
        for item in root_path.glob(f'**/*{ext}'):
            if item.is_file():
                files.append(item)

    return files

async def process_files(files: List[pathlib.Path], output_dir: str) -> None:
    """ファイルのリストを処理する

    Args:
        files: 処理対象のファイルのリスト
        output_dir: 出力先ディレクトリ
    """
    total_files = len(files)
    logger.info(f"Found {total_files} files to process")

    success_count = 0
    for i, file in enumerate(files, 1):
        logger.info(f"Processing file {i}/{total_files}: {file}")
        
        success = await convert_to_markdown(str(file), output_dir)
        if success:
            success_count += 1

    logger.info(f"Conversion completed. Successfully converted {success_count}/{total_files} files.")

async def main():
    """メイン関数"""
    # スクリプトのディレクトリを取得
    script_dir = pathlib.Path(__file__).parent.absolute()
    
    # コマンドライン引数の設定
    parser = argparse.ArgumentParser(description='各種ファイルをMarkdownに変換するツール')
    parser.add_argument('--input-dir', 
                       default=str(script_dir / 'target'),
                       help='変換対象ファイルが含まれているディレクトリのパス（デフォルト: ./target）')
    args = parser.parse_args()

    # 入力ディレクトリの作成（存在しない場合）
    input_dir = pathlib.Path(args.input_dir)
    if not input_dir.exists():
        os.makedirs(input_dir)
        logger.info(f"Created target directory: {input_dir}")

    logger.info(f"Searching for files in: {input_dir}")
    
    # 出力先ディレクトリを作成
    output_dir = create_output_dir(str(input_dir))
    
    # 変換対象ファイルを検索
    files = find_convertible_files(str(input_dir))
    
    if not files:
        logger.info(f"No convertible files found in {input_dir}")
        return
    
    # ファイルを処理
    await process_files(files, output_dir)

if __name__ == "__main__":
    asyncio.run(main())
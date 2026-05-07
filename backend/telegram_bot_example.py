"""
Contoh Implementasi Telegram Bot (C2) untuk berinteraksi dengan AI "Jules".
Pastikan untuk menginstal dependensi sebelum menjalankan:
pip install python-telegram-bot

Cara Menjalankan:
1. Masukkan BOT_TOKEN dari BotFather.
2. Jalankan: python telegram_bot_example.py
"""

import logging
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Dummy Data untuk mensimulasikan State/Database
AVAILABLE_REPOS = [
    "1. MyNextjsApp",
    "2. BackendFastAPI",
    "3. JulesAI-Core"
]

AVAILABLE_BRANCHES = {
    "MyNextjsApp": ["1. main", "2. dev", "3. feature/ui"],
    "BackendFastAPI": ["1. main", "2. staging", "3. add-fastapi-backend"],
    "JulesAI-Core": ["1. master", "2. experimental"]
}

ACTIVE_SESSIONS = [
    "1. Session #101 (Bugfix UI)",
    "2. Session #102 (Add Logging API)",
    "3. Session #103 (New Feature: Auth)"
]

# State untuk percakapan
CHOOSING_REPO = 1
CHOOSING_BRANCH = 2
CHOOSING_SESSION = 3

# --- Mock AI Function (Jules membalas pesan) ---
def get_jules_response(message: str, current_repo: str, current_branch: str) -> str:
    """
    Simulasi Jules merespons chat biasa dari user.
    Nantinya ini bisa dihubungkan ke API Gemini atau LLM lainnya.
    """
    logger.info(f"[Jules menerima pesan]: {message}")

    if "error" in message.lower() or "bug" in message.lower():
        return f"Jules: Oke, aku akan coba cek file log di repo {current_repo} branch {current_branch}. Ada detail error-nya?"
    elif "approve" in message.lower():
        return "Jules: Plan approved! Aku akan mulai mengeksekusi kode sekarang. Tunggu sebentar ya."
    else:
        return f"Jules: Siap! Berada di repo {current_repo} ({current_branch}). Akan segera aku kerjakan: '{message}'. Ada tambahan lain?"

# --- Command Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    welcome_message = (
        "Halo! Aku Jules (C2 Control).\n"
        "Gunakan perintah berikut untuk mengatur environment kerjaku:\n"
        "/set_repo - Memilih repository\n"
        "/set_branch - Memilih branch di repo yang aktif\n"
        "/session - Memilih session kerja\n"
        "/approve - Menyetujui plan yang kuberikan\n\n"
        "Setelah di-set, kamu bisa langsung chat biasa kepadaku!"
    )
    # Default context
    context.user_data['current_repo'] = "None"
    context.user_data['current_branch'] = "None"

    await update.message.reply_text(welcome_message)

async def set_repo_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Memulai proses pemilihan repository."""
    repo_list = "\n".join(AVAILABLE_REPOS)
    await update.message.reply_text(
        f"Berikut daftar repository yang tersedia:\n{repo_list}\n\nKirimkan *angka* repo yang ingin kamu pilih.",
        parse_mode="Markdown"
    )
    return CHOOSING_REPO

async def handle_repo_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Menyimpan pilihan repository dari user."""
    text = update.message.text
    try:
        choice = int(text) - 1
        selected_repo = AVAILABLE_REPOS[choice].split(". ")[1]
        context.user_data['current_repo'] = selected_repo
        context.user_data['current_branch'] = "main" # default reset

        await update.message.reply_text(f"✅ Repository berhasil di-set ke: *{selected_repo}*", parse_mode="Markdown")
    except (ValueError, IndexError):
        await update.message.reply_text("❌ Input tidak valid. Tolong kirimkan angka yang sesuai dengan daftar repo.")
        return CHOOSING_REPO

    return ConversationHandler.END

async def set_branch_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Memulai proses pemilihan branch."""
    current_repo = context.user_data.get('current_repo')

    if not current_repo or current_repo == "None":
        await update.message.reply_text("Kamu belum memilih repository. Gunakan /set_repo terlebih dahulu.")
        return ConversationHandler.END

    branches = AVAILABLE_BRANCHES.get(current_repo, ["1. main"])
    context.user_data['temp_branches'] = branches

    branch_list = "\n".join(branches)
    await update.message.reply_text(
        f"Repo aktif: *{current_repo}*\nBerikut branch yang tersedia:\n{branch_list}\n\nKirimkan *angka* branch yang ingin kamu gunakan.",
        parse_mode="Markdown"
    )
    return CHOOSING_BRANCH

async def handle_branch_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Menyimpan pilihan branch."""
    text = update.message.text
    branches = context.user_data.get('temp_branches', [])

    try:
        choice = int(text) - 1
        selected_branch = branches[choice].split(". ")[1]
        context.user_data['current_branch'] = selected_branch
        await update.message.reply_text(f"✅ Branch berhasil dipindah ke: *{selected_branch}*", parse_mode="Markdown")
    except (ValueError, IndexError):
        await update.message.reply_text("❌ Input tidak valid. Tolong kirimkan angka yang sesuai dengan daftar branch.")
        return CHOOSING_BRANCH

    return ConversationHandler.END

async def session_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Memilih session aktif."""
    session_list = "\n".join(ACTIVE_SESSIONS)
    await update.message.reply_text(
        f"Daftar Active Sessions:\n{session_list}\n\nKirimkan *angka* session yang ingin kamu lanjutkan.",
        parse_mode="Markdown"
    )
    return CHOOSING_SESSION

async def handle_session_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Menyimpan pilihan session."""
    text = update.message.text
    try:
        choice = int(text) - 1
        selected_session = ACTIVE_SESSIONS[choice].split(". ")[1]
        context.user_data['current_session'] = selected_session
        await update.message.reply_text(f"✅ Terhubung ke session: *{selected_session}*\nAku siap mendengarkan instruksi!", parse_mode="Markdown")
    except (ValueError, IndexError):
        await update.message.reply_text("❌ Input tidak valid. Pilih angka session yang tersedia.")
        return CHOOSING_SESSION

    return ConversationHandler.END

async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Command untuk approve plan."""
    await update.message.reply_text("Jules: Plan approved! ✅ \nProses eksekusi dan coding sedang berjalan. Akan kuberi tahu jika sudah pre-commit.")

async def handle_general_chat(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Menangani chat biasa (tanpa slash command) dan meneruskannya ke Jules (AI)."""
    user_message = update.message.text

    current_repo = context.user_data.get('current_repo', 'Unknown Repo')
    current_branch = context.user_data.get('current_branch', 'Unknown Branch')

    # Dapatkan balasan dari Jules
    jules_reply = get_jules_response(user_message, current_repo, current_branch)

    # Kirim balasan kembali ke Telegram user
    await update.message.reply_text(jules_reply)

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Membatalkan conversation saat ini."""
    await update.message.reply_text("Operasi dibatalkan. Kamu bisa lanjut chat denganku.")
    return ConversationHandler.END

def main() -> None:
    """Mulai bot Telegram."""
    # TODO: Ganti "YOUR_TELEGRAM_BOT_TOKEN" dengan token asli dari BotFather
    BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"

    if BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN":
        print("PERINGATAN: Ganti BOT_TOKEN dengan token asli kamu sebelum menjalankan!")
        return

    application = Application.builder().token(BOT_TOKEN).build()

    # Setup Conversation Handlers untuk input angka
    repo_conv_handler = ConversationHandler(
        entry_points=[CommandHandler("set_repo", set_repo_command)],
        states={CHOOSING_REPO: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_repo_choice)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    branch_conv_handler = ConversationHandler(
        entry_points=[CommandHandler("set_branch", set_branch_command)],
        states={CHOOSING_BRANCH: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_branch_choice)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    session_conv_handler = ConversationHandler(
        entry_points=[CommandHandler("session", session_command)],
        states={CHOOSING_SESSION: [MessageHandler(filters.TEXT & ~filters.COMMAND, handle_session_choice)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    application.add_handler(repo_conv_handler)
    application.add_handler(branch_conv_handler)
    application.add_handler(session_conv_handler)

    # Basic commands
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("approve", approve_command))

    # Handler untuk pesan teks biasa (Chat ke Jules)
    # Ini menangkap semua teks yang bukan command (karena sudah disaring oleh filter command)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_general_chat))

    # Jalankan polling
    print("Bot is running. Press Ctrl+C to stop.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()

import discord
from discord import app_commands
import json
import os

VENDING_DATA_FILE = "vending_data.json"

def load_allowed_users():
    if os.path.exists(VENDING_DATA_FILE):
        try:
            with open(VENDING_DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [str(uid) for uid in data.get("allowed_user_ids", [])]
        except:
            return []
    return []

def is_allowed():
    async def predicate(interaction: discord.Interaction) -> bool:
        if await interaction.client.is_owner(interaction.user):
            return True

        if interaction.guild and interaction.user.id == interaction.guild.owner_id:
            return True

        allowed_ids = load_allowed_users()
        if str(interaction.user.id) in allowed_ids:
            return True

        if not interaction.response.is_done():
            await interaction.response.send_message("🚫 権限がありません。管理者のみ実行可能です。", ephemeral=True)
        return False

    return app_commands.check(predicate)

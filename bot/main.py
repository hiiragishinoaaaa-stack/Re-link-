import discord
from discord.ext import commands
import os
import sys
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'cogs')))

# ========================================

TOKEN = os.getenv("DISCORD_TOKEN", "")
STATUS = os.getenv("BOT_STATUS", "BOT製作者:@ehuru_078")

# ========================================

class MyBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        activity = discord.Game(name=STATUS)

        super().__init__(
            command_prefix="!",
            intents=intents,
            activity=activity,
            status=discord.Status.online
        )

    async def setup_hook(self):
        target_cogs = ["paypay_cog", "vending_cog"]

        for name in target_cogs:
            try:
                await self.load_extension(f"cogs.{name}")
                print(f"✅ {name} の読み込みに成功")
            except Exception as e:
                print(f"❌ {name} の読み込みに失敗:\n{e}")

        await self.tree.sync()
        print("🌐 スラッシュコマンドを同期しました")

bot = MyBot()

@bot.event
async def on_ready():
    print(f"ログインしました {bot.user} (ID: {bot.user.id})")
    print("------")

bot.run(TOKEN)

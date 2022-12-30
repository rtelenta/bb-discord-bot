const { Client, GatewayIntentBits, Collection } = require("discord.js")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const path = require("path")
const { TOKEN, CLIENT_ID } = require("./constants")

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
})

const getCommands = async () => {
  const commands = []
  client.commands = new Collection()

  const commandsPath = path.join(__dirname, "commands")
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    const commandData = await command.data

    client.commands.set(commandData.name, command)
    commands.push(commandData.toJSON())
  }

  return commands
}

client.on("ready", async () => {
  const commands = await getCommands()
  const guild_ids = client.guilds.cache.map((guild) => guild.id)

  const rest = new REST({ version: "9" }).setToken(TOKEN)
  for (const guildId of guild_ids) {
    rest
      .put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
        body: commands,
      })
      .then(() =>
        console.log("Successfully updated commands for guild " + guildId)
      )
      .catch(console.error)
  }
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: "There was an error executing this command",
    })
  }
})

client.login(TOKEN)

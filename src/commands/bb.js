const { SlashCommandBuilder } = require("@discordjs/builders")
const {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
} = require("@discordjs/voice")
const supabase = require("../db")

const audios = async () => {
  const { data } = await supabase.from("audios").select()

  return data
}

const data = async () => {
  const audiosData = await audios()
  const choices = audiosData.map(({ name, id }) => ({ name, value: id }))

  const command = new SlashCommandBuilder()
    .setName("bb")
    .setDescription("Comandos besorios")
    .addStringOption((option) =>
      option
        .setName("audio")
        .setDescription("Audios bebesorios")
        .setRequired(true)
        .addChoices(...choices)
    )

  return command
}

module.exports = {
  data: data(),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return

    if (!interaction.member.voice.channel)
      return await interaction.reply("Conectate a un canal de voz pe")

    if (interaction.commandName === "bb") {
      const { value: audioId } = interaction.options.get("audio")
      const audiosData = await audios()
      const audioUrl = audiosData.find(({ id }) => id === audioId).url

      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })

      const resource = createAudioResource(audioUrl, {
        inlineVolume: true,
      })

      const player = createAudioPlayer()
      connection.subscribe(player)
      player.play(resource)

      return await interaction.reply("Ahí va tu gaa!")
    }

    await interaction.reply("...")
  },
}

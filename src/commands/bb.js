const { SlashCommandBuilder } = require("@discordjs/builders")
const { AsciiTable3, AlignmentEnum } = require("ascii-table3")
const {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
} = require("@discordjs/voice")
const supabase = require("../db")

const getAudios = async () => {
  const { data } = await supabase.from("audios").select().eq("enabled", true)

  return data
}

const getBebes = async () => {
  const { data } = await supabase.from("bebes").select()

  return data
}

const addLog = async (audio_id) => {
  await supabase.from("usage").insert([{ audio_id }])
}

const getRanking = async () => {
  const { data } = await supabase.rpc("get_usage_ranking").limit(10)

  return data.map(({ audio, bebe, count }, index) => [
    index + 1,
    count,
    audio,
    bebe,
  ])
}

const data = async () => {
  const audios = await getAudios()
  const bebes = await getBebes()

  const bebesWithAudios = bebes
    .map((bebe) => {
      return {
        name: bebe.name,
        audios: audios
          .filter((audio) => audio.bebe_id === bebe.id)
          .map(({ name, id }) => ({ name, value: id })),
      }
    })
    .filter(({ audios }) => !!audios.length)

  const command = new SlashCommandBuilder()
    .setName("bb")
    .setDescription("Comandos besorios")
    .addSubcommand((subcommand) =>
      subcommand.setName("rank").setDescription("Contador de audios mas usados")
    )

  for (const bebe of bebesWithAudios) {
    command.addSubcommand((subcommand) =>
      subcommand
        .setName(bebe.name.toLowerCase())
        .setDescription(`Audios de ${bebe.name}`)
        .addStringOption((option) =>
          option
            .setName("audio")
            .setDescription("Audios bebesorios")
            .setRequired(true)
            .addChoices(...bebe.audios)
        )
    )
  }

  return command
}

module.exports = {
  data: data(),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return

    if (!interaction.member.voice.channel)
      return await interaction.reply("Conectate a un canal de voz pe")

    if (
      interaction.commandName === "bb" &&
      interaction.options?._subcommand === "rank"
    ) {
      const ranking = await getRanking()
      const table = new AsciiTable3("Audios mas usados")
        .setHeading("Rank", "Usado", "Audio", "Autor")
        .setAlign(1, AlignmentEnum.CENTER)
        .setAlign(4, AlignmentEnum.CENTER)
        .addRowMatrix(ranking)

      await interaction.reply("```\n" + table.toString() + "```")
      return
    }

    if (interaction.commandName === "bb") {
      const { value: audioId } = interaction.options.get("audio")
      const audiosData = await getAudios()
      const audio = audiosData.find(({ id }) => id === audioId)

      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })

      const resource = createAudioResource(audio.url, {
        inlineVolume: true,
      })

      const player = createAudioPlayer()
      connection.subscribe(player)
      player.play(resource)

      player.on("idle", () => {
        connection.destroy()
      })

      await interaction.reply(audio.name)
      await addLog(audioId)

      setTimeout(() => interaction.deleteReply(), 5000)

      return
    }

    await interaction.reply("...")
  },
}

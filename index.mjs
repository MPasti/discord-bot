import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import {
  palavrasFeiasDosMeusAmigos,
  insults,
  piadas,
  respostasPiadas,
} from "./resources/keyWords.mjs";
import { insultResponses, normalResponses } from "./resources/responses.mjs";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import path from "path";
import { fileURLToPath } from "url";
import { Player } from "discord-music-player";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const player = new Player(client, {
  leaveOnEnd: false,
  leaveOnStop: false,
  leaveOnEmpty: true,
  quality: "high",
});
client.player = player;

const TOKEN = process.env.DISCORD_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("guildCreate", (guild) => {
  const defaultChannel =
    guild.systemChannel ||
    guild.channels.cache.find((channel) => channel.type === "GUILD_TEXT");
  if (defaultChannel) {
    defaultChannel.send("Bom meus lindos! Sou o bot criado pelo @pasti.js 🥳");
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const isPublicChannel = message.guild !== null;

  const messageContent = message.content.toLowerCase();
  if (
    palavrasFeiasDosMeusAmigos.some((word) => messageContent.includes(word))
  ) {
    message.reply("LÁ ELEEEEEEEEEE").then(() => {
      message.react("😏");
    });
    return;
  }

  if (
    message.reference &&
    message.mentions.repliedUser &&
    message.mentions.repliedUser.id === client.user.id
  ) {
    if (insults.some((insult) => messageContent.includes(insult))) {
      const randomResponse =
        insultResponses[Math.floor(Math.random() * insultResponses.length)];
      message.reply(randomResponse);
      return;
    }
  }

  if (message.content === "!hello") {
    message.reply("E aí meu rei!");
  }

  if (message.mentions.has(client.user)) {
    const randomResponse =
      normalResponses[Math.floor(Math.random() * normalResponses.length)];
    message.reply(randomResponse);
  }

  if (message.content.startsWith("!calc")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 3) {
      message
        .reply(
          "Por favor, forneça uma operação e dois números. Exemplo: !calc soma 2 3"
        )
        .then(() => {
          message.react("😢");
        });
      return;
    }

    const operation = args[0].toLowerCase();
    const num1 = parseFloat(args[1]);
    const num2 = parseFloat(args[2]);

    if (isNaN(num1) || isNaN(num2)) {
      message.reply("Amigão, mande-me números válidos né 👨‍🏫").then(() => {
        message.react("😢");
      });
      return;
    }

    let result;
    switch (operation) {
      case "soma":
      case "somar":
        result = num1 + num2;
        break;
      case "subtracao":
      case "subtração":
      case "sub":
        result = num1 - num2;
        break;
      case "multiplicação":
      case "multiplicacao":
      case "mult":
        result = num1 * num2;
        break;
      case "divide":
      case "divisao":
      case "divisão":
      case "div":
        if (num2 === 0) {
          message.reply("Fi, zoa não, não tem como dividir por 0.").then(() => {
            message.react("😢");
          });
          return;
        }
        result = num1 / num2;
        break;
      default:
        message
          .reply(
            "Escreva uma das 4 operações básicas para mim fazer, pode ser soma, subtração, multiplicação ou divisão!"
          )
          .then(() => {
            message.react("😢");
          });
        return;
    }

    message.reply(`O resultado é ${result} 😱😱👨‍💻`).then(() => {
      message.react("🤓");
    });
  }

  if (message.content === "!comandos") {
    message.reply(`Aqui estão os comandos que você pode usar:
    1. **!comandos** - Lista todos os comandos disponíveis.
    2. **!hello** - Receba uma saudação do bot.
    3. **!calc [operação] [número1] [número2]** - Realiza um cálculo com a operação e números fornecidos. Operações suportadas: soma, subtração, multiplicação, divisão.
    4. **!piada** - Fala uma piada!
    5. **!join** - Faz o bot entrar no canal de voz e tocar um áudio.
    6. **!privado** - O bot te chama no privado
    7. **!enquete [nome da enquete] - Para criar uma enquete
    8. **!perfil - Para falar sobre seu perfil`);
  }

  if (message.content === "!join") {
    if (message.member.voice.channel) {
      const channel = message.member.voice.channel;

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(
        path.join(__dirname, "assets", "rapaz.mp3"),
        {
          inputType: "ffmpeg",
          inlineVolume: true,
        }
      );

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      message.reply("Entrei no canal!");
    } else {
      message.reply(
        "Para me chamar para uma chamada, você precisa estar nela!"
      );
    }
  }

  if (message.content === "!piada") {
    const piada = piadas[Math.floor(Math.random() * piadas.length)];
    message.reply(piada);
    return;
  }

  if (
    message.reference &&
    message.mentions.repliedUser &&
    message.mentions.repliedUser.id === client.user.id
  ) {
    const originalMessage = message.channel.messages.cache.get(
      message.reference.messageId
    );
    if (originalMessage && respostasPiadas[originalMessage.content]) {
      message.reply(respostasPiadas[originalMessage.content]);
    }
  }

  if (message.content === "!privado") {
    if (!isPublicChannel) {
      await message.reply("Esse comando só pode ser usado em um servidor!");
    } else {
      await message.author.send("Opa, me chamou?!");
    }
  }

  if (message.content === "!perfil") {
    const { username, id, createdAt, bot } = message.author;
    const userInfo = `
      ## Aqui estão suas informações:
      Nome de usuário: ${username}
      ID: ${id}
      Criado em: ${createdAt.toDateString()}
      Bot: ${bot ? "Sim" : "Não"}

      Prazer em te conhecer ${username} 😇!
    `;

    message.reply(userInfo);
  }

  if (message.content.startsWith("!enquete")) {
    const args = message.content.split(" ").slice(1);
    const question = args.join(" ");
    if (!question) {
      message.reply("Por favor, forneça uma pergunta.");
      return;
    }

    const pollMessage = await message.channel.send(
      `📊 **Enquete:** ${question}`
    );
    await pollMessage.react("👍");
    await pollMessage.react("👎");
  }

  if (message.content.startsWith("!play")) {
    const args = message.content.split(" ").slice(1);
    const query = args.join(" ");
    if (!query) {
      message.reply("Manda o URL de uma música também");
      return;
    }

    if (message.member.voice.channel) {
      const queue = player.createQueue(message.guild.id);
      await queue.join(message.member.voice.channel);
      const song = await queue.play(query).catch((_) => {
        if (!queue) queue.stop();
      });

      message.reply(`Tocando agora: ${song.name}`);
    } else {
      message.reply(
        "Meu amigo, você precisa estar num canal de voz para poder usar esse comando!"
      );
    }
  }

  if (message.content.startsWith("!jokenpo")) {
    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size !== 2) {
      message.reply("Por favor, mencione duas pessoas para jogar!");
      return;
    }

    const players = Array.from(mentionedUsers.values());
    const user1 = players[0];
    const user2 = players[1];

    message.channel.send(
      `${user1} e ${user2}, por favor, escolham entre 'pedra', 'papel' ou 'tesoura' e me mencionem na mensagem.`
    );

    const filter = (response) =>
      response.author.id === user1.id || response.author.id === user2.id;
    const collector = message.channel.createMessageCollector({
      filter,
      max: 2,
      time: 30000,
    });

    let choices = {};
    let count = 0;

    collector.on("collect", (response) => {
      const choice = response.content.toLowerCase().trim();
      if (!["pedra", "papel", "tesoura"].includes(choice)) {
        response.reply(
          "Escolha inválida! Por favor, escolha entre 'pedra', 'papel' ou 'tesoura'."
        );
        return;
      }

      choices[response.author.id] = choice;
      count++;

      if (count === 2) {
        collector.stop();
      }
    });

    collector.on("end", () => {
      if (Object.keys(choices).length !== 2) {
        message.reply("Tempo esgotado! O jogo foi cancelado.");
        return;
      }

      const [user1Choice, user2Choice] = Object.values(choices);

      let result;
      if (user1Choice === user2Choice) {
        result = "Empate!";
      } else if (
        (user1Choice === "pedra" && user2Choice === "tesoura") ||
        (user1Choice === "papel" && user2Choice === "pedra") ||
        (user1Choice === "tesoura" && user2Choice === "papel")
      ) {
        result = `${user1} ganhou!`;
      } else {
        result = `${user2} ganhou!`;
      }

      message.channel.send(
        `${user1} escolheu ${user1Choice}, ${user2} escolheu ${user2Choice}. ${result}`
      );
    });
  }
});

client.login(TOKEN);

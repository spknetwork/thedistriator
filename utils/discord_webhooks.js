const { EmbedBuilder, WebhookClient } = require("discord.js");

function sendOnWebHook(title, subtitle, actionUser, user, id, token) {
  const webHook = new WebhookClient({
    id: id,
    token: token,
  });
  let embed = new EmbedBuilder().setColor(0x0000ff);
  embed.setTitle(title);
  embed.setDescription(subtitle);
  webHook.send({
    username: user,
    avatarURL: `https://images.hive.blog/u/${user}/avatar`,
    embeds: [embed],
  });
}

exports.sendOnWebHook = sendOnWebHook;

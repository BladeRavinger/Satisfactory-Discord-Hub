const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

const { servers } = require('../../servers.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changeoptions')
        .setDescription('Change server options for a specific server')
        .addStringOption(option =>
            option.setName('server')
                .setDescription('Select a server to change options')
                .setRequired(true)
                .addChoices(
                    Object.entries(servers).slice(0, 25).map(([serverName, serverIp]) => ({
                        name: serverName,
                        value: serverName
                    }))
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const selectedServer = interaction.options.getString('server');
        // Fetch the server IP from servers.json
        const serverIp = servers[selectedServer].address;
        const apiToken = servers[selectedServer].token;
        if (!serverIp) {
            await interaction.reply({ content: `Server IP for ${selectedServer} not found.`, ephemeral: false });
            return;
        }

        console.log(`Fetching server options for ${selectedServer} with IP ${serverIp}`);

        const fetchServerOptions = async (serverIp) => {
            try {
                const response = await fetch(`https://${serverIp}/api/v1`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "function": "GetServerOptions" })
                });

                const data = await response.json();

                if (!data.data || !data.data.serverOptions) {
                    console.error('Unexpected API response:', data);
                    return null;
                }

                return data.data.serverOptions;

            } catch (error) {
                console.error('Error fetching server options:', error);
                return null;
            }
        };

        const options = await fetchServerOptions(serverIp);

        if (!options) {
            await interaction.reply({ content: `Could not fetch options for ${selectedServer}.`, ephemeral: false });
            return;
        }

        const optionNameMapping = {
            "FG.DSAutoPause": "Auto Pause",
            "FG.DSAutoSaveOnDisconnect": "Auto Save",
            "FG.AutosaveInterval": "Autosave (min)",
            "FG.ServerRestartTimeSlot": "Restart Time (hr:min)",
            "FG.SendGameplayData": "Gameplay Data",
            "FG.NetworkQuality": "Network Quality"
        };

        const formatTime = (totalMinutes) => {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours}h ${minutes < 10 ? '0' : ''}${minutes}m`;
        };

        const formattedOptions = Object.keys(options).map(key => {
            let value = options[key];

            if (key === "FG.AutosaveInterval") {
                value = `${value / 60} min`;
            }

            if (key === "FG.ServerRestartTimeSlot") {
                value = formatTime(value);
            }

            return {
                setting: optionNameMapping[key] || key,
                option: value
            };
        });

        // Embed with improved aesthetics and an image
        const initialEmbed = new EmbedBuilder()
            .setTitle(`${selectedServer} Options`)
            .setDescription('Below are the current server options:')
            .setThumbnail('https://static.wikia.nocookie.net/satisfactory_gamepedia_en/images/b/be/Build_Gun.png/revision/latest?cb=20221115150746') // Add your thumbnail image URL here
            .setImage('https://example.com/banner-image.png') // Add your main image URL here
            .addFields(
                { name: 'Settings', value: formattedOptions.map(opt => opt.setting).join('\n'), inline: true },
                { name: 'Option', value: formattedOptions.map(opt => opt.option).join('\n'), inline: true }
            )
            .setColor(0x00AE86) // Change color to match the theme
            .setTimestamp()
            .setFooter({ text: 'Server Management', iconURL: 'https://example.com/footer-icon.png' }); // Add a footer icon

        const message = await interaction.reply({
            embeds: [initialEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        new ButtonBuilder()
                            .setCustomId('open_modal')
                            .setLabel("Edit Options")
                            .setStyle(ButtonStyle.Primary)
                    ]
                }
            ],
            fetchReply: true
        });

        let newOptions = {}; // Global variable to store new options

        const filter = i => i.customId === 'open_modal' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 180000 });

        collector.once('collect', async i => {
            if (i.customId === 'open_modal') {
                const modal = new ModalBuilder()
                    .setCustomId('change_options_modal')
                    .setTitle(`Change Options for ${selectedServer}`);

                const autoPauseInput = new TextInputBuilder()
                    .setCustomId('FG.DSAutoPause')
                    .setLabel(optionNameMapping['FG.DSAutoPause'])
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(options['FG.DSAutoPause'].toString())
                    .setRequired(false);

                const autoSaveInput = new TextInputBuilder()
                    .setCustomId('FG.DSAutoSaveOnDisconnect')
                    .setLabel(optionNameMapping['FG.DSAutoSaveOnDisconnect'])
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(options['FG.DSAutoSaveOnDisconnect'].toString())
                    .setRequired(false);

                const autosaveIntervalInput = new TextInputBuilder()
                    .setCustomId('FG.AutosaveInterval')
                    .setLabel(optionNameMapping['FG.AutosaveInterval'])
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder((options['FG.AutosaveInterval'] / 60).toString())
                    .setRequired(false);

                const serverRestartInput = new TextInputBuilder()
                    .setCustomId('FG.ServerRestartTimeSlot')
                    .setLabel(optionNameMapping['FG.ServerRestartTimeSlot'])
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder((options['FG.ServerRestartTimeSlot'] / 60).toFixed(2))
                    .setRequired(false);

                const sendGameplayInput = new TextInputBuilder()
                    .setCustomId('FG.SendGameplayData')
                    .setLabel(optionNameMapping['FG.SendGameplayData'])
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(options['FG.SendGameplayData'].toString())
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(autoPauseInput),
                    new ActionRowBuilder().addComponents(autoSaveInput),
                    new ActionRowBuilder().addComponents(autosaveIntervalInput),
                    new ActionRowBuilder().addComponents(serverRestartInput),
                    new ActionRowBuilder().addComponents(sendGameplayInput)
                );

                await i.showModal(modal); // No defer here

                const handleModalSubmit = async (modalInteraction) => {
                    if (!modalInteraction.isModalSubmit()) return;
                    if (modalInteraction.customId !== 'change_options_modal') return;

                    // Check that the modal interaction is from the correct user
                    if (modalInteraction.user.id !== interaction.user.id) {
                        return modalInteraction.reply({ content: 'You cannot submit this modal.', ephemeral: true });
                    }

                    try {
                        // Get new options from modal submission, use original value if input is empty
                        newOptions = {
                            "FG.DSAutoPause": modalInteraction.fields.getTextInputValue('FG.DSAutoPause') || options['FG.DSAutoPause'].toString(),
                            "FG.DSAutoSaveOnDisconnect": modalInteraction.fields.getTextInputValue('FG.DSAutoSaveOnDisconnect') || options['FG.DSAutoSaveOnDisconnect'].toString(),
                            "FG.AutosaveInterval": modalInteraction.fields.getTextInputValue('FG.AutosaveInterval') ? (parseInt(modalInteraction.fields.getTextInputValue('FG.AutosaveInterval')) * 60).toString() : options['FG.AutosaveInterval'].toString(),
                            "FG.ServerRestartTimeSlot": modalInteraction.fields.getTextInputValue('FG.ServerRestartTimeSlot') ? (parseFloat(modalInteraction.fields.getTextInputValue('FG.ServerRestartTimeSlot')) * 60).toString() : options['FG.ServerRestartTimeSlot'].toString(),
                            "FG.SendGameplayData": modalInteraction.fields.getTextInputValue('FG.SendGameplayData') || options['FG.SendGameplayData'].toString(),
                        };

                        // Create arrays for old and new values to display in the embed
                        const oldValues = Object.keys(newOptions).map(key => {
                            let value = options[key];
                            if (key === "FG.AutosaveInterval") {
                                value = `${value / 60} min`;
                            } else if (key === "FG.ServerRestartTimeSlot") {
                                value = formatTime(value);
                            }
                            return value;
                        });

                        const newValues = Object.keys(newOptions).map(key => {
                            let value = newOptions[key];
                            if (key === "FG.AutosaveInterval") {
                                value = `${value / 60} min`;
                            } else if (key === "FG.ServerRestartTimeSlot") {
                                value = formatTime(value);
                            }
                            return value;
                        });

                        // Update the original embed
                        const updatedEmbed = new EmbedBuilder()
                            .setTitle(`${selectedServer} Updated Options`)
                            .setDescription('Here are the changes you have made:')
                            .setThumbnail('https://static.wikia.nocookie.net/satisfactory_gamepedia_en/images/b/be/Build_Gun.png/revision/latest?cb=20221115150746') // Add your thumbnail image URL here
                            .setImage('https://example.com/banner-image.png') // Add your main image URL here
                            .addFields(
                                { name: 'Settings', value: Object.keys(newOptions).map(k => optionNameMapping[k]).join('\n'), inline: true },
                                { name: 'Old Option', value: oldValues.join('\n'), inline: true },
                                { name: 'New Option', value: newValues.join('\n'), inline: true }
                            )
                            .setColor(0x00AE86)
                            .setTimestamp()
                            .setFooter({ text: 'Server Management', iconURL: 'https://example.com/footer-icon.png' }); // Add a footer icon

                        await message.edit({
                            embeds: [updatedEmbed],
                            components: [
                                {
                                    type: 1,
                                    components: [
                                        new ButtonBuilder()
                                            .setCustomId('submit_changes')
                                            .setLabel('Submit')
                                            .setStyle(ButtonStyle.Success),
                                        new ButtonBuilder()
                                            .setCustomId('cancel_changes')
                                            .setLabel('Cancel')
                                            .setStyle(ButtonStyle.Danger)
                                    ]
                                }
                            ]
                        });

                        await modalInteraction.deferUpdate(); // Acknowledge modal submission
                        interaction.client.removeListener('interactionCreate', handleModalSubmit); // Remove listener to prevent multiple calls
                    } catch (error) {
                        console.error('Error handling modal submission:', error);
                    }
                };

                interaction.client.once('interactionCreate', handleModalSubmit);
            }
        });

        // Button collector for submit/cancel
        const buttonCollector = interaction.channel.createMessageComponentCollector({ time: 180000 });

        buttonCollector.on('collect', async (buttonInteraction) => {
            try {
                if (buttonInteraction.customId === 'submit_changes') {
                    await buttonInteraction.deferReply(); // Acknowledge the button interaction

                    const response = await fetch(`https://${serverIp}/api/v1`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${apiToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "function": "ApplyServerOptions",
                            "data": {
                                "UpdatedServerOptions": newOptions
                            }
                        })
                    });

                    await buttonInteraction.editReply({ content: 'Changes applied successfully.', components: [] });

                    // Update original message to remove buttons
                    await message.edit({
                        components: []
                    });

                    // Stop the collector after completion
                    buttonCollector.stop();
                } else if (buttonInteraction.customId === 'cancel_changes') {
                    await buttonInteraction.deferReply(); // Acknowledge the button interaction
                    await buttonInteraction.editReply({ content: 'Changes canceled.', components: [] });

                    // Update original message to remove buttons
                    await message.edit({
                        components: []
                    });

                    // Stop the collector after completion
                    buttonCollector.stop();
                }
            } catch (error) {
                console.error('Error applying server options:', error);
                if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                    await buttonInteraction.reply({ content: 'Error applying server options.', components: [] });
                }
            }
        });

        // Once either button is clicked, the button collector stops and no further interactions are handled
        buttonCollector.on('end', () => {
            console.log('Button collector stopped.');
        });
    }
};

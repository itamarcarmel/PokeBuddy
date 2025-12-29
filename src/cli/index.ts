#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import axios from "axios";

// Default server URL
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";

// Ensure stdin is properly configured
if (process.stdin.isTTY) {
  process.stdin.setRawMode(false);
}

const program = new Command();

program
  .name("pokebuddy-cli")
  .description("PokeBuddy CLI - Chat with your Pokemon AI assistant")
  .version("1.0.0");

// Helper function to format date for display
function formatChatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Chat command
program
  .command("chat")
  .description("Start an interactive chat session with the Pokemon AI")
  .option("-d, --debug", "Enable debug mode to see resource usage")
  .action(async (options) => {
    const debugMode = options.debug || false;

    console.log(chalk.blue.bold("\n🎮 PokeBuddy Chat - Interactive Mode\n"));
    if (debugMode) {
      console.log(chalk.yellow("🔍 Debug mode enabled - Resource tracking active\n"));
    }

    // Check if server is running
    try {
      await axios.get(`${SERVER_URL}/api/llm/status`);
    } catch (error) {
      console.log(
        chalk.red(
          `❌ Cannot connect to server at ${SERVER_URL}. Make sure the server is running.`
        )
      );
      console.log(chalk.yellow("\nStart the server with: npm run start:dev\n"));
      process.exit(1);
    }

    // Fetch existing chat sessions
    let sessions = [];
    try {
      const response = await axios.get(`${SERVER_URL}/api/sessions`);
      sessions = response.data;
    } catch (error) {
      console.log(chalk.red("⚠️ Could not fetch chat sessions. Starting fresh."));
    }

    // Ask user to select or create a session
    const choices = [
      { name: chalk.green("➕ Start New Chat"), value: "new" },
      new inquirer.Separator(),
    ];

    if (sessions.length > 0) {
      choices.push(
        { name: chalk.cyan("📋 Resume Existing Chat"), value: "resume" },
        new inquirer.Separator()
      );
    }

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices,
      },
    ]);

    let chatSessionId: number | null = null;

    if (action === "new") {
      // Create new chat session
      try {
        const response = await axios.post(`${SERVER_URL}/api/sessions`);
        chatSessionId = response.data.id;
        console.log(
          chalk.green(`\n✅ New chat session created (ID: ${chatSessionId})\n`)
        );
      } catch (error) {
        console.log(chalk.red("❌ Failed to create chat session"));
        process.exit(1);
      }
    } else if (action === "resume") {
      // Show list of existing sessions
      const sessionChoices = sessions.map((session: any) => ({
        name: `${formatChatDate(session.createdAt)} - ${
          session.conversations?.length || 0
        } messages`,
        value: session.id,
      }));

      const { selectedSession } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedSession",
          message: "Select a chat session to resume:",
          choices: sessionChoices,
        },
      ]);

      chatSessionId = selectedSession;

      // Fetch and display chat history
      try {
        const response = await axios.get(
          `${SERVER_URL}/api/sessions/${chatSessionId}/messages`
        );
        const history = response.data;

        if (history.length > 0) {
          console.log(chalk.blue("\n📜 Chat History:\n"));
          console.log(chalk.gray("─".repeat(60)));

          history.forEach((conv: any) => {
            console.log(chalk.cyan("You:"));
            console.log(chalk.white(`  ${conv.message}`));
            console.log(chalk.green("\n🤖 PokeBuddy:"));
            console.log(chalk.white(`  ${conv.response}`));
            console.log(chalk.gray("─".repeat(60)));
          });

          console.log("\n");
        }
      } catch (error) {
        console.log(chalk.red("⚠️ Could not fetch chat history"));
      }
    }

    console.log(chalk.gray("Type 'exit' or 'quit' to end the conversation\n"));

    let chatting = true;
    while (chatting) {
      try {
        const answers = await inquirer.prompt([
          {
            type: "input",
            name: "message",
            message: chalk.cyan("You:"),
            validate: (input) => {
              if (!input || input.trim().length === 0) {
                return "Please enter a message";
              }
              return true;
            },
          },
        ]);

        const message = answers.message;

        if (message.toLowerCase() === "exit" || message.toLowerCase() === "quit") {
          console.log(chalk.blue("\n👋 Thanks for chatting! Goodbye!\n"));
          chatting = false;
          break;
        }

        try {
          console.log(chalk.gray("\nThinking...\n"));

          const response = await axios.post(
            `${SERVER_URL}/api/sessions/${chatSessionId}/messages`,
            {
              message: message.trim(),
            }
          );

          console.log(chalk.green("🤖 PokeBuddy:"));
          console.log(chalk.white(response.data.response));

          // Display debug info only if --debug flag is enabled
          if (debugMode) {
            if (response.data.debug) {
              console.log(
                chalk.gray("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
              );
              console.log(chalk.yellow("🔍 Debug Information"));
              console.log(
                chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
              );

              // LLM Info
              if (response.data.debug.llm) {
                console.log(chalk.cyan("\n🤖 LLM Provider:"));
                console.log(
                  chalk.white(`  Provider: ${response.data.debug.llm.provider}`)
                );
                console.log(chalk.white(`  Model: ${response.data.debug.llm.model}`));
                console.log(
                  chalk.white(
                    `  Connected: ${
                      response.data.debug.llm.connected ? "✅ Yes" : "❌ No"
                    }`
                  )
                );
              }

              // Intent Classification
              if (response.data.debug.classification) {
                console.log(chalk.cyan("\n📋 Intent Classification:"));
                console.log(
                  chalk.white(
                    `  Pokemon Related: ${
                      response.data.debug.classification.isPokemonRelated
                        ? "✅ Yes"
                        : "❌ No"
                    }`
                  )
                );
                console.log(
                  chalk.white(
                    `  Battle Simulation: ${
                      response.data.debug.classification.isBattleSimulation
                        ? "✅ Yes"
                        : "❌ No"
                    }`
                  )
                );
                console.log(
                  chalk.white(
                    `  Endpoints Called: ${response.data.debug.classification.endpointsCount}`
                  )
                );
                console.log(
                  chalk.white(
                    `  Processing Time: ${response.data.debug.classification.processingTime}ms`
                  )
                );
              }

              // Resources Used with timing
              if (
                response.data.debug.resourcesUsed &&
                response.data.debug.resourcesUsed.length > 0
              ) {
                console.log(chalk.cyan("\n📡 Resources Used:"));
                response.data.debug.resourcesUsed.forEach((resource: any) => {
                  console.log(
                    chalk.white(
                      `  • ${resource.source} (${resource.parameter}) - ${resource.responseTime}ms`
                    )
                  );
                });
              }

              // Processing Timeline
              if (response.data.debug.timing) {
                console.log(chalk.cyan("\n⏱️  Processing Timeline:"));
                console.log(
                  chalk.white(
                    `  1. Classification: ${response.data.debug.timing.classification}ms`
                  )
                );
                console.log(
                  chalk.white(
                    `  2. API Fetch: ${response.data.debug.timing.apiFetch}ms`
                  )
                );
                console.log(
                  chalk.white(
                    `  3. LLM Generation: ${response.data.debug.timing.llmGeneration}ms`
                  )
                );
                console.log(chalk.white(`  ─────────────────────────────`));
                console.log(
                  chalk.yellow(`  Total: ${response.data.debug.timing.total}ms`)
                );
              }

              console.log(
                chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
              );
            } else {
              console.log(chalk.red("\n⚠️ Debug data not found in response\n"));
            }
          }

          console.log();

          // Continue to next iteration
          continue;
        } catch (error: any) {
          if (error.response) {
            console.log(
              chalk.red(
                `\n❌ Error: ${error.response.data.message || "Unknown error"}\n`
              )
            );
          } else {
            console.log(chalk.red(`\n❌ Connection error: ${error.message}\n`));
          }
          // Continue chatting even after error
          continue;
        }
      } catch (error: any) {
        // Handle inquirer errors (like Ctrl+C)
        if (error.isTtyError) {
          console.log(
            chalk.red(
              "\n❌ This prompt couldn't be rendered in the current environment\n"
            )
          );
        } else if (error.message && error.message.includes("User force closed")) {
          console.log(chalk.blue("\n👋 Chat ended\n"));
        } else {
          console.log(
            chalk.yellow(`\n⚠️ Prompt error: ${error.message || "Unknown error"}\n`)
          );
          console.log(
            chalk.gray(
              "Chat session ended. Please try running the chat command again.\n"
            )
          );
        }
        chatting = false;
        break;
      }
    }

    // Ensure clean exit
    process.exit(0);
  });

// Pokemon command
program
  .command("pokemon <name>")
  .description("Get information about a Pokemon")
  .action(async (name) => {
    try {
      console.log(chalk.blue(`\n🔍 Fetching ${name}...\n`));

      const response = await axios.get(
        `${SERVER_URL}/api/pokemon/${name.toLowerCase()}`
      );

      const pokemon = response.data;

      console.log(chalk.green.bold(`✨ ${pokemon.name.toUpperCase()}`));
      console.log(chalk.gray("─".repeat(40)));
      console.log(chalk.cyan("ID:"), pokemon.id);
      console.log(
        chalk.cyan("Types:"),
        pokemon.types.map((t: any) => t.type.name).join(", ")
      );
      console.log(chalk.cyan("Height:"), `${pokemon.height / 10}m`);
      console.log(chalk.cyan("Weight:"), `${pokemon.weight / 10}kg`);

      if (pokemon.abilities && pokemon.abilities.length > 0) {
        console.log(
          chalk.cyan("Abilities:"),
          pokemon.abilities.map((a: any) => a.ability.name).join(", ")
        );
      }

      if (pokemon.stats && pokemon.stats.length > 0) {
        console.log(chalk.cyan("\nStats:"));
        pokemon.stats.forEach((stat: any) => {
          const barLength = Math.floor(stat.base_stat / 5);
          const bar = "█".repeat(barLength);
          console.log(
            `  ${stat.stat.name.padEnd(20)} ${String(stat.base_stat).padStart(
              3
            )} ${chalk.green(bar)}`
          );
        });
      }

      console.log();
    } catch (error: any) {
      console.log(
        chalk.red(
          `\n❌ Error: ${error.response?.data?.message || "Pokemon not found"}\n`
        )
      );
    }
  });

// Search command
program
  .command("search <query>")
  .description("Search for Pokemon by name or type")
  .action(async (query) => {
    try {
      console.log(chalk.blue(`\n🔍 Searching for: ${query}...\n`));

      const response = await axios.get(`${SERVER_URL}/api/pokemon/search`, {
        params: { query },
      });

      const results = response.data;

      if (!results || results.length === 0) {
        console.log(chalk.yellow("No results found.\n"));
        return;
      }

      console.log(chalk.green.bold(`Found ${results.length} Pokemon:\n`));

      results.forEach((pokemon: any, index: number) => {
        console.log(chalk.cyan(`${index + 1}.`), chalk.white(pokemon.name));
      });

      console.log();
    } catch (error: any) {
      console.log(
        chalk.red(`\n❌ Error: ${error.response?.data?.message || error.message}\n`)
      );
    }
  });

// Status command
program
  .command("status")
  .description("Check server and LLM connection status")
  .action(async () => {
    try {
      console.log(chalk.blue("\n📊 Checking server status...\n"));

      const response = await axios.get(`${SERVER_URL}/api/llm/status`);
      const status = response.data;

      console.log(chalk.green("✅ Server is running"));
      console.log(
        chalk.cyan("LLM Status:"),
        status.connected ? chalk.green("Connected") : chalk.red("Disconnected")
      );
      console.log(
        chalk.cyan("LLM Enabled:"),
        status.enabled ? chalk.green("Yes") : chalk.red("No")
      );

      if (status.availableModels && status.availableModels.length > 0) {
        console.log(chalk.cyan("\nAvailable Models:"));
        status.availableModels.forEach((model: any) => {
          console.log(chalk.white(`  - ${model.name}`));
        });
      }

      console.log();
    } catch (error: any) {
      console.log(
        chalk.red(`\n❌ Cannot connect to server at ${SERVER_URL}\n${error.message}\n`)
      );
    }
  });

// Parse arguments
program.parse();

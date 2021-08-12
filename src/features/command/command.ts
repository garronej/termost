import { DEFAULT_COMMAND_NAME } from "../../constants";
import { format } from "../message/helpers";
import { CommandName, ProgramContext } from "../types";
import { FluentInterface } from "./fluentInterface";

export class Command extends FluentInterface {
	#name: CommandName;

	constructor(
		name: CommandName,
		description: string,
		programContext?: ProgramContext
	) {
		super(description, programContext);
		this.#name = name;

		this.option({
			name: "help",
			description: "Display the help center",
		}).option({
			name: "version",
			description: "Print the version",
		});

		setTimeout(() => {
			// @note: if the user command doesn't match the the command instance name, then do not execute the command
			if (this.programContext.currentCommand === this.#name) {
				// @note: setTimeout 0 allows to run activation logic in the next event loop iteration.
				// It'll allow to make sure that the `programContext` is correctly filled with all commands
				// metadata (especially to let the global help option to display all available commands):
				this.#enable();
			}
		}, 0);
	}

	/**
	 * Enables the command by processing all executors (options, pending tasks...)
	 * @returns The disable function to stop tasks and unregister the command on the fly
	 */
	async #enable() {
		if ("help" in this.programContext.options) {
			return this.#help();
		}

		if ("version" in this.programContext.options) {
			return this.#version();
		}

		this.manager.traverse();
	}

	#help() {
		const { description, options } = this.commandContext.metadata;
		const optionKeys = Object.keys(options);
		const hasOption = optionKeys.length > 0;
		const hasCommands =
			this.#name === DEFAULT_COMMAND_NAME &&
			this.programContext.commandRegistry.length > 0;
		const print = (...parameters: Parameters<typeof format>) =>
			console.log(format(...parameters));
		const printTitle = (message: string) =>
			print(`\n${message}:`, {
				color: "yellow",
				modifier: ["bold", "underline", "uppercase"],
			});
		const printLabelValue = (
			label: string,
			value: string,
			padding: number
		) =>
			print(
				`  ${format(label.padEnd(padding + 1, " "), {
					color: "green",
				})} ${value}`
			);

		printTitle("Usage");
		print(
			`${format(
				`${process.argv0}${
					hasCommands ? "" : ` ${String(this.#name)}`
				}`,
				{
					color: "green",
				}
			)} ${hasCommands ? "<command> " : ""}${
				hasOption ? "[...options]" : ""
			}`
		);

		printTitle("Description");
		print(description);

		const padding = [
			...this.programContext.commandRegistry.map(
				(command) => command.name
			),
			...optionKeys,
		].reduce((padding, item) => {
			return Math.max(padding, item.length);
		}, 0);

		if (hasCommands) {
			printTitle("Commands");

			for (const { name, description } of this.programContext
				.commandRegistry) {
				printLabelValue(name, description, padding);
			}
		}

		if (hasOption) {
			printTitle("Options");

			for (const key of optionKeys) {
				printLabelValue(key, options[key] as string, padding);
			}
		}
	}

	#version() {
		console.info("TODO: version");
	}
}

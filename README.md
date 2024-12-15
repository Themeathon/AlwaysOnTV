# Always On TV

**Your 24/7 VOD streaming companion**

Always On TV is a powerful tool that allows you to manage YouTube videos and playlists and stream them continuously. It functions as an OBS Browser Source, making it easy to integrate with your streaming setup. With Always On TV, you can queue videos and playlists, ensuring non-stop entertainment for your viewers.

## Features

- Video and Playlist Management: Easily organize and manage your YouTube videos and playlists within Always On TV.
- Queue System: Queue videos and playlists that will play continuously. Once the queue is empty, Always On TV can randomly select videos from a default playlist.
- Twitch Integration: Always On TV automatically updates your Twitch streaming title and game based on the currently playing video. This feature requires a Twitch connection to be set up.

## Installation

To install Always On TV, follow these steps:

1. Download the [latest release](https://github.com/Themeathon/AlwaysOnTV/releases/latest) from the Releases page.
2. Extract it into a directory of your choice.
3. Open a terminal or command prompt and navigate to the extracted directory.
4. Run the following command to install the required dependencies:
   ```
   npm install
   ```
   
## Usage

To start Always On TV, follow these steps:

1. Ensure you have completed the installation procedure.
2. In the terminal or command prompt, navigate to the project directory.
3. Run the following command to start Always On TV:
   ```
   npm start
   ```
   By default, Always On TV starts a web server on ports 8085. You can configure th port in the `config.json` file.

The first time you launch Always On TV, a default configuration will be created. The default password to access the web interface is "AlwaysOnTV," but you can change it in the `config.json` file.

### Opening the web UI

To access the Always On TV web interface, follow these steps:

1. Ensure Always On TV is running.
2. Open your web browser and navigate to `localhost:8085` (or the port set in the `config.json` file).

### Twitch Integration

To enable Twitch integration, follow these steps:

1. Visit the Twitch developer console at [https://dev.twitch.tv](https://dev.twitch.tv) and sign in with your Twitch account.
2. Create a new application and obtain the client ID and client secret.
3. Set the callback URL to `<your server address here>/auth/connect/twitch/callback` in the Twitch application settings. For example, when running with default settings locally, the callback URL should be `http://localhost:8085/auth/connect/twitch/callback`.
4. Copy the client ID and client secret from the Twitch developer console.
5. Open the Always On TV web interface and navigate to the Settings tab.
6. Paste the client ID and client secret into the corresponding fields and click save.
7. The "Connect With Twitch" button will now be clickable, allowing you to establish the Twitch connection.

## Contributions

Contributions to Always On TV are welcome! If you encounter any issues or have ideas for improvements, please submit an issue or a pull request on the GitHub repository.

## License

Always On TV is released under the [MIT License](LICENSE).

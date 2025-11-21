module.exports = {
	apps: [
		// Development - single instance
		{
			name: "server-dev",
			script: "./src/server.js",
			watch: true,
			instances: 1,
			exec_mode: "fork",
			interpreter: "node",
			interpreterArgs: "--experimental-modules",
			env: {
				NODE_ENV: "development",
				PORT: 3000,
			},
		},

		// Testing - single instance
		{
			name: "server-test",
			script: "./src/server.js",
			watch: true,
			instances: 1,
			exec_mode: "fork",
			interpreter: "node",
			interpreterArgs: "--experimental-modules",
			env: {
				NODE_ENV: "testing",
				PORT: 5000,
			},
		},

		// Production - cluster mode
		{
			name: "server-prod",
			script: "./src/server.js",
			watch: false, // disable watch in prod
			instances: 1, // number of Node instances
			exec_mode: "cluster", // cluster mode for load balancing
			interpreter: "node",
			interpreterArgs: "--experimental-modules",
			env: {
				NODE_ENV: "production",
				PORT: 7000, // all cluster instances share same port
			},
		},
	],
};

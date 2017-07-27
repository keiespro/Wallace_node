# Wallace Server

Server side API for Wallace web app.

## Requirements

* [Node.js](https://nodejs.org)
* [Redis](http://redis.io)
* [MySQL](https://www.mysql.com)


## Getting Started

1. Clone repo: `git clone git@github.com:roamandwander/wallace-server.git`
2. `cd` into folder: `cd wallace-server`
3. Install dependencies: `npm install`
4. Set mysql database settings in `/config/settings.json`
5. Start server: `npm start`

## Testing

1. Start server with `npm start`
2. Start [wallace-frontend](https://github.com/roamandwander/wallace-frontend)
3. Use wallace-frontend to test at [http://localhost:8080](http://localhost:8080)

## Files and Folders

* `app/`: Node.js Express app for serving API.
	* `lib/etherpad-api.js`: module for making requests from Express to Etherpad api.
	* `models/`: model definitions and logic.
	* `routes/`: Express routes.
	* `app.js`: main script to start Express server.
	* `setup_passport.js`: script to set up authentication.
* `config/`: configuration files.
	* `database.json`: MySQL database configurations.
	* `etherpad-settings.json`: Etherpad settings.
	* `settings.json`: general app-wide settings.
* `etherpad/`: git subtree to [Etherpad Lite](https://github.com/ether/etherpad-lite)
* `etherpad_custom/src/static/custom/`: folder that gets symlinked to matching `etherpad` folder to load custom css/js within Etherpad iframe.
* `migrations/`: Sequelize migrations.
* `gulpfile.js`: Gulp task runner.
* `package.json`: Node/npm configuration.
* `server.js`: script to load Sequelize then start Express server.
* `shipitfile.js`: script for deploys using [Shipit](https://github.com/shipitjs/shipit)

## Deploying

Deployments are made to AWS EC2 instance.

**Setup:**

1. Add `wallace-staging` to `~/.ssh/config`:

    ```
    HostName 52.91.73.110
    	User ec2-user
    	IdentityFile ~/certs/RWDev.pem
    	ForwardAgent yes
    	KeepAlive yes
    	StrictHostKeyChecking no
    ```
	
2. Test that you can ssh with `ssh wallace-staging`

**Deploy:**  
Run `npm run deploy-staging`

## API enpoints

All API requests should be made with json body and will respond with json.

#### /sign_up (_POST_)
* parameters:
	* `fullName`
	* `email`
	* `password`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`

#### /sign_in (_POST_)
* parameters:
	* `email`
	* `password`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`

#### /sign_out (_GET_)
* parameters:
	* none
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`

#### /auth_check (_GET_)
* parameters:
	* none
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "not authenticated" }`

#### /verify_account (_POST_)
* parameters:
	* `token`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`


#### /reset_password (_POST_)
* parameters:
	* `email`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`

#### /set_password (_POST_)
* parameters:
	* `token`
	* `password`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error message" }`

#### /papers (_GET_)
* parameters:
	* none
* response:
	* success: `{ "message": "success", "papers": [paper,paper,...] }`
	* success: `{ "error": "error" }`

#### /papers/create (_POST_)
* parameters:
	* `title`
	* `type`
* response:
	* success: `{ "message": "success", "paperId": paperId }`
	* success: `{ "error": "error" }`

#### /papers/delete/:id (_POST_)
* parameters:
	* none
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error" }`

#### /papers/title/:id (_POST_)
* parameters:
	* `id`
	* `title`
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error" }`

#### /papers/import/:id (_POST_)
* parameters:
	* multipart form with `document` as file
* response:
	* success: `{ "message": "success" }`
	* success: `{ "error": "error" }`

#### /papers/:id (_GET_)
* parameters:
	* none
* response:
	* success: `{ "message": "success", "url": "embed_url", "title": "title" }`
	* success: `{ "error": "error" }`

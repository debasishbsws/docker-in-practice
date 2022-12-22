Before starting with this part 2, I recommend you check part 1 of the "Docker in Practice" series.

# Build an Image

A Dockerfile is a text file that contains instructions for building a Docker image. A Docker image is a lightweight, stand-alone, executable package that includes everything needed to run a piece of software, including the application code, system tools, libraries, and runtime.

### Create the application we will dockerize

We will containerize a simple Node.js application. Suppose you know Node and Express, then great. If you don't, then follow the steps.

1.  Open up any empty folder.
2.  If you have Node installed, you can open up the terminal, go to that directory, and run `npm init -y`, which will create a `package.json` file with all the default values. Also, you should install Express by running `npm i express`.

    Now your `package.json` file will look something like this:

    ```json
    {
      "name": "code",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "keywords": [],
      "author": "",
      "license": "ISC",
      "dependencies": {
        "express": "^4.18.2"
      }
    }
    ```

    Here we just added the "**start**" script to this file so that the application will start by running `npm start`.

    _<mark>If you don't have Node </mark>_ you can create the 'package.json' file and paste the above JSON code.

3.  Create the `index.js` file in the same folder and write a simple express app.

    ```javascript
    const express = require("express");
    const app = express();

    //values from env
    const PORT = process.env.PORT || 3000;

    //request
    app.get("/", (req, res) => {
      res.send("<h1>Hello World!!</h1>");
    });

    //app listening
    app.listen(PORT, () => {
      console.log(`App listening at http://localhost:${PORT}`);
    });
    ```

Our application is ready to be Dockerized. If you have Node in your system, you can run `npm start`, open a web browser, and navigate to `http://localhost:3000`. You should see the message "Hello, World!!" displayed in your browser. We don't need Node installed for this tutorial, as we will run this app inside a container.

## Creating a Dockerfile

Create an empty file called `Dockerfile` in the folder

```bash
touch Dockerfile
```

Open the `Dockerfile` in your favorite text editor.

We first need to define the base image (the image from which we want to build our image). Here we will use the latest LTS (long-term support) version `16` of `node` available from the [Docker Hub](https://hub.docker.com/_/node):

```plaintext
# Comments
FROM node:16
```

Next, we create a directory to hold the application code inside the image, this will be the working directory for your application, and your application code will be inside this folder:

```plaintext
# Create an app directory
WORKDIR /usr/src/app
```

The base image comes with Node.js and NPM already installed, so we next need to install your app dependencies using the `npm` binary. We specify to copy our `package.json` file to the image working directory using `COPY` instruction and also run `npm install` inside the container terminal using `RUN` instruction

```plaintext
# Install app dependencies
COPY package*.json ./
RUN npm install
```

Now we copy our app's source code inside the Docker image.

```plaintext
# Bundle app source
COPY . .
```

**Note** that we are only copying the `package.json` file rather than copying the entire working directory. This allows us to take advantage of cached Docker layers. For a good explanation, check [this](https://docs.docker.com/build/cache/).

Our application will listen to port `3000`, and we need to `EXPOSE` that port to have it mapped by the Docker daemon:

```plaintext
EXPOSE 3000
```

Last, define the command to run your app using `CMD`, which determines your runtime. Here we will use `npm start` to start the server. Or we can use `node index.js` :

```plaintext
CMD [ "npm", "start" ]
```

Now our `Dockerfile` should finally look like this:

```plaintext
# Comments
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]
```

<mark>Note that it is the general structure of a Dockerfile, but every other application may need extra care. Remember, Google is your best friend; always go to the </mark> [<mark>documentation </mark>](https://docs.docker.com/engine/reference/builder/) <mark>whenever you get stuck.</mark>

## .dockerignore

Now, if you think about a real scenario, our source folder will not only have the essential files, but there will be many files we do not want to include inside our containers, such as compiled binaries, temporary files, test files, git information, or a README.md file from your image to keep it as small as possible. Here we use the `.dockerignore` file.

This file is a list of patterns that tells Docker which files and directories to ignore when building an image.

Create a `.dockerignore` file and open that up:

```bash
touch .dockerignore
```

include

```bash
node_modules
.git
.idea
test/*
Dockerfile
.dockerignore
docker-compose*.ymal
```

This `.dockerignore` file tells Docker to ignore the `node_modules` directory, the `.git` directory, the `.idea` directory, any `docker-compose` file, and the `test` directory; also, we don't want to include the `Dockerfile` inside our container, not even the `.dockerignore`.

## Build the image

To build a Docker image from a Dockerfile, you can use the `docker build` command. It reads the instructions in the Dockerfile and creates an image based on those instructions.

Here is the basic syntax of the `docker build` command:

```bash
docker build [OPTIONS] PATH
```

- `PATH` is the path to the directory that contains the Dockerfile and the application source code.

Here are some common options for the `docker build` command:

- `-t` or `--tag`: Specifies the name and optionally a tag to the name in the `name:tag` format.
- `--file`: Specifies the name of the Dockerfile (default is `"Dockerfile"`).
- `--build-arg`: Sets build-time variables for the image.

Here we will build a Docker image from a Dockerfile located in the current directory:

```bash
docker build -t my-node-app .
```

This command will build an image with the tag `my-node-app` using the instructions in the `Dockerfile` located in the current directory (`.`). Now if you run `docker image ls` you can see an image named `my-node-app` which is the image we build. And if we run that image as a container the app will print "Hello World!" into the browser.

There are also some other types:

To build an image from a Git repository, you can use the URL of the repository as the `PATH` argument:

```bash
docker build -t my-image https://github.com/user/repo.git
```

This command clones the Git repository at the specified URL, build an image with the tag `my-image` using the instructions in the `Dockerfile` located in the repository, and then deletes the cloned repository.

You can also build an image from a Dockerfile located in a remote repository by specifying the URL of the Dockerfile as the `PATH` argument:

```bash
docker build -t my-image https://github.com/user/repo/blob/master/Dockerfile
```

This command will download the Dockerfile from the specified URL, build an image with the tag `my-image` using the instructions in the `Dockerfile`, and then delete the downloaded Dockerfile.

## Run the Image as a container

Now to run the image as a container, we will use the following:

```bash
docker run -p 3000:3000 -d --name node-app my-node-app
```

### Environment variables:

Now, if you watch the code of the `index.js` file, there is a line `const PORT = process.env.PORT || 3000;` that determines the `PORT` the application will listen. Here we expect to take the `PORT` as an Environment variable, but we are hardcoding it everywhere. How can I set an ENV VAR in a container?

We use`-e` or `--env` flag when running a Docker container using the `docker run` command.

Here is the basic syntax of the `docker run` command with the `-e` flag:

```bash
docker run -e VARNAME=value image [command] [arguments]
```

Now we can replace our `docker run` command with the new one:

```bash
docker run -e PORT=3000 -p 3000:3000 -d --name node-app my-node-app
```

But In a real scenario, we may have multiple Environment variables such as Database URL, Authentication Key, API key, etc., and it is impractical to add all of them one by one in the command line.

Instead, we can also pass environment variables to a Docker container using a file which is a more practical way when we have a bunch of ENV variables. To do this, we can use the `--env-file` flag and specify the path to the file that contains the environment variables. The file should contain one environment variable per line in the `VARNAME=value` format.

To pass the environment variables from a file called `.env` to the Docker container, we can use the following command:

```bash
docker run --env-file .env -p 3000:3000 -d --name node-app my-node-app
```

Using environment variables can be a helpful way to configure the Docker containers and customize their behavior at runtime.

We should also change the `Dockerfile` where we have specified to `EXPOSE PORT`. We can replace it with

```bash
ENV PORT 3000
EXPOSE $PORT
```

Here if we specify the PORT while running, it will take that PORT, and if we do not pass anything, it will use the default `3000`.

### Database Container

Now let us run a Database as a container; we will also connect it with our application. It will make our application more like a real-world one. We will create a MongoDB instance using the official MongoDB image (mongo) from DockerHub.

```bash
docker run -p 27017:27017 --name mongodb mongo
```

It will create the Mongo container and forward the mongo PORT `27017` to our local PORT `27017`.

### Adding data to the database

1.  Connect to the MongoDB container using the `mongo` command-line client:

```bash
docker exec -it mongodb mongosh
```

This command will connect to the MongoDB instance running in the container and open the `mongo` shell.

2.  Create a new database and collection in the MongoDB instance:

```bash
use mydatabase
db.createCollection("mycollection")
```

This command will create a new database called `mydatabase` and a new collection called `mycollection` in the MongoDB instance.

3.  Insert some data into the collection:

```bash
db.mycollection.insert({ name: "John", age: 30 })
db.mycollection.insert({ name: "Jane", age: 25 })
```

This line will insert two documents into the `mycollection` collection.

4.  Verify that the data has been inserted:

```bash
db.mycollection.find()
```

This will display the documents in the `mycollection` collection.

![](<.github/images/11dbfind().png>)

Let us remove the container from the system.

```bash
docker rm -f mongodb
```

Now, if we rerun the container and try to fetch the data using following commands.

```bash
docker run -p 27017:27017 --name mongodb mongo
docker exec -it mongodb mongosh
use mydatabase
db.mycollection.find()
```

We will not find the data we inserted before, and why is that?

When we delete a container, it will delete everything inside it, including the data we have saved. But it contradicts the purpose of a database's purpose; it should persist the data inside it. To do that, we use **Docker Volume.**

# Docker Volumes

A Docker volume is a persistent storage location that stores data from Docker containers. Volumes are stored outside of the Union File System (UFS) of the container, meaning that the volume data is not deleted when the container is deleted.

Volumes can be used in several different ways, such as:

- **Storing database data**: You can use a volume to store data from a database running in a Docker container. This allows you to preserve the data even if the container is deleted or stopped.
- **Sharing data between containers**: You can use a volume to share data between multiple containers. This can be useful if you have multiple containers that need access to the same data, such as a web server and a database.
- **Mounting a host directory as a volume**: You can use a Volume to mount a host directory as a volume inside the container. This allows you to access data on the host machine from within the container or to share data between the container and the host.

To create a volume, you can use the `docker volume create` command. For example, to create a volume called `my-data`, you can use the following command:

```bash
docker volume create my-data
```

To use a volume with a Docker container, you can use the `-v` or `--volume` flag when running the `docker run` command. The `-v` flag takes a `volume-name:container-dir` argument.

For example, to mount the `/app/data` directory on the host machine as the `/data` directory in the container, you can use the following command:

```bash
docker run -v my-data:/data image [command] [arguments]
```

You can also use the `--mount` flag to specify additional options for the Volume, such as the volume name and the read-write mode.

For example, to mount the `my-data` volume as the `/data` directory in the container in read-only mode, you can use the following command:

```bash
docker run --mount source=my-data,target=/data image [command] [arguments]
```

You can use the `docker volume ls` command to list all of the volumes on your system and the `docker volume rm volume-name` command to delete a volume.

There is another type of Volume called blind mount to mount a host directory, as a volume in Docker allows you to access data on the host machine from within the container or to share data between the container and the host.

To mount a host directory as a volume in a Docker container, you can use the `-v` or `--volume` flag when running the `docker run` command.

The `-v` flag takes a `host-dir:container-dir` argument, where `host-dir` is the path to the host directory and `container-dir` is the path to the directory inside the container where the Volume will be mounted.

For example, to mount the `/app/data` directory on the host machine as the `/data` directory in the container, you can use the following command:

```bash
bash docker run -v /app/data:/data image [command] [arguments]
```

This will mount the `/app/data` directory on the host machine as the `/data` directory in the container. The data in the `/app/data` directory will be accessible from within the container at the `/data` directory.

- Any changes made to the data in the `/app/data` directory on the host will be reflected in the `/data` directory in the container, and vice versa.

  You can also use the `--mount` flag to specify additional options for the Volume, such as the read-write mode.

  ```bash
  docker run --mount type=bind,source=/app/data,target=/data,readonly image [command] [arguments]
  ```

  This will mount the `/app/data` directory on the host machine as the `/data` directory in the container in read-only mode, which means that the data in the `/data` directory in the container cannot be modified.

If we check the [documentation for docker mongo](https://hub.docker.com/_/mongo), we can see that the **data was stored in the default location** `/data/db` **inside the container**, so we need to mount it to a volume we created.

```bash
docker run -v my-data:/data/db -p 27017:27017 --name mongodb mongo
```

Now, if we delete `mongodb` container and start again mounting the same Volume (`my-data`) our data will be there.

#### Here are some common Docker volume commands:

1.  `docker volume create`: This command is used to create a new Docker volume. You can specify the name of the volume as an argument. For example:

```bash
docker volume create my-volume
```

This will create a new volume called `my-volume`.

2.  `docker volume ls`: This command is used to list all of the Docker volumes on your system. You can use the `--filter` flag to filter the list by volume name or other criteria. For example:

```bash
docker volume ls
```

This will list all of the Docker volumes on your system.

```bash
docker volume ls --filter "dangling=true"
```

This will list all of the "dangling" volumes on your system, which are volumes that are not attached to any containers.

3.  `docker volume inspect`: This command is used to display detailed information about a Docker volume. You can specify the name of the volume as an argument. For example:

```bash
docker volume inspect my-volume
```

This will display detailed information about the `my-volume` volume, including the volume driver, mount point, and labels.

4.  `docker volume rm`: This command is used to delete a Docker volume. You can specify the name of the volume as an argument. For example:

```bash
docker volume rm my-volume
```

This will delete the `my-volume` volume.

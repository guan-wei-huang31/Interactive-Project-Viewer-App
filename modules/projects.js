require("dotenv").config();
require("pg");
const Sequelize = require("sequelize");

//const projectData = require("../data/projectData");
//const sectorData = require("../data/sectorData");
//let projects = [];

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true, // This will help you connect to the database with SSL
      rejectUnauthorized: false, // Allows self-signed certificates
    },
  },
});

// Create Models
const Sector = sequelize.define(
  "Sector",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sector_name: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  },
);

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: Sequelize.STRING,
    feature_img_url: Sequelize.STRING,
    summary_short: Sequelize.TEXT,
    intro_short: Sequelize.TEXT,
    impact: Sequelize.TEXT,
    original_source_url: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  },
);

Project.belongsTo(Sector, { foreignKey: "sector_id" });

// Initialize Database
function Initialize() {
  return new Promise((resolve, reject) => {
    Project.sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    Project.findAll({ include: [Sector] })
      .then((project) => {
        resolve(project);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getProjectById(projectId) {
  return new Promise((resolve, reject) => {
    Project.findAll({
      include: [Sector],
      where: { id: projectId },
    })
      .then((project) => {
        if (project.length > 0) {
          resolve(project[0]);
        } else {
          reject(`Unable to find requested project`);
        }
      })
      .catch((error) => {
        reject(`Error occurred: ${error.message}`);
      });
  });
}

function getProjectsBySector(sector) {
  return new Promise((resolve, reject) => {
    Project.findAll({
      include: [Sector],
      where: {
        "$Sector.sector_name$": {
          [Sequelize.Op.iLike]: `%${sector}%`,
        },
      },
    })
      .then((project) => {
        console.log("Projects by Sector:", project);
        if (project.length > 0) {
          resolve(project);
        } else {
          reject("Unable to find requested projects");
        }
      })
      .catch((error) => {
        reject(`Error occurred: ${error.message}`);
      });
  });
}

function getAllSectors() {
  console.log("Attempting to fetch sectors...");
  return Sector.findAll()
    .then((sectors) => {
      if (sectors.length > 0) {
        return Promise.resolve(sectors);
      } else {
        return Promise.reject("No sectors found");
      }
    })
    .catch((err) => Promise.reject(`Failed to fetch sectors: ${err.message}`));
}

//Add a new project
function addProject(projectData) {
  return new Promise((resolve, reject) => {
    Project.create(projectData)
      .then(() => resolve())
      .catch((err) => reject(err.errors[0].message));
  });
}

// Edit a project
function editProject(id, projectData) {
  return Project.update(projectData, {
    where: { id: id },
  })
    .then(() => Promise.resolve())
    .catch((err) => Promise.reject(err.errors[0].message));
}

// Delete a project
function deleteProject(id) {
  return new Promise((resolve, reject) => {
    Project.destroy({
      where: {
        id: id,
      },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(
          err.errors && err.errors[0]
            ? err.errors[0].message
            : "Failed to delete project",
        );
      });
  });
}

module.exports = {
  Initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject,
  editProject,
  deleteProject,
};

/*
sequelize
.sync()
.then( async () => {
  try{
    await Sector.bulkCreate(sectorData); 
    await Project.bulkCreate(projectData);

    await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Sectors"', 'id'), (SELECT MAX(id) FROM "Sectors"))`);
    await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Projects"', 'id'), (SELECT MAX(id) FROM "Projects"))`);

    console.log("-----");
    console.log("data inserted successfully");
  }catch(err){
    console.log("-----");
    console.log(err.message);

    // NOTE: If you receive the error:

    // insert or update on table "Projects" violates foreign key constraint "Projects_sector_id_fkey"
    // it is because you have a "project" in your collection that has a "sector_id" that does not exist in "sectorData".   
    // To fix this, use PgAdmin to delete the newly created "Sectors" and "Projects" tables, fix the error in your .json files and re-run this code
  }

  process.exit();
})
.catch((err) => {
  console.log('Unable to connect to the database:', err);
});
*/

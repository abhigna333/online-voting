'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Elections.belongsTo(models.Admins, {
        foreignKey: "adminId"
      })
    }

    static async getAllElections(adminId){
      return this.findAll({
        where: { adminId },
      });
    }

    static async addElection({ name, adminId }){
      return this.create({ 
        electionName: name, 
        launched: false, 
        adminId: adminId,
      });
    }
  }
  Elections.init({
    electionName: DataTypes.STRING,
    launched: DataTypes.BOOLEAN,
    launchDate: DataTypes.DATEONLY,
    endDate: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Elections',
  });
  return Elections;
};
const Service = require('../models/Service');

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addService = async (req, res) => {
  const { name, description, price } = req.body;

  try {
    const newService = new Service({
      name,
      description,
      price
    });

    const service = await newService.save();
    res.json(service);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
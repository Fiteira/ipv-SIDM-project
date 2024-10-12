import { Request, Response } from 'express';
// Importar o modelo de usuário
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const auth = require('../config/passport')
const Joi = require('joi');
const cache = require("../config/cache");
import { ValidationErrorItem } from 'joi';


const { func } = require('joi');



exports.login = async (req: Request, res: Response) => {
  if (!req.body.email) {
    return res.status(400).send({
      success: false,
      message: "O email está vazio."
    })
  }

  if (!req.body.password) {
    return res.status(400).send({
      success: false,
      message: "A password está vazia."
    })
  }

  let user;
  try {
    user = await User.findOne({ where: { email: req.body.email } });
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "O email ou a password estão incorretos."

      })
    }
  } catch (error) {
    res.status(500).send(
      {
        success: false,
        message: "Erro ao verificar o email: " + error
      }
    )
  }

  // Verifica se o usuário está ativado.
  if (user.estado === 0) {
    console.log("Conta desativada")
    return res.status(401).send(
      {
        success: false,
        message: "A conta está desativada. Por favor, verifique o seu email ou contacte a adminstração."
      }
    )
  }

  // Verificiar password´

  try {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      const payload =
      {
        email: user.email,
        id: user.utilizador_id
      }
      const token = jwt.sign(payload, "mudar", { expiresIn: "1d" })
      // Check if it's the first login
      if (!user.primeiroLogin) {
        user.primeiroLogin = new Date();
      }

      // Update last login
      user.ultimoLogin = new Date();

      await user.save();
      return res.status(200).send(
        {
          success: true,
          message: "Bearer " + token
        })
    }
    else {
      return res.status(401).send(
        {
          message: "O email ou a password estão incorretos.",
          success: false
        })
    }

  } catch (error) {
    res.status(500).send(
      {
        message: "Erro de autenticação: " + error,
        success: false
      }
    );
  }
}
exports.register = async (req: Request, res: Response) => {

  const schema = Joi.object({
    nome: Joi.string().min(3).required().messages({
      'string.base': 'O nome deve ser uma string válida',
      'string.empty': 'O nome não pode estar vazio',
      'string.min': 'O nome deve ter no mínimo {#limit} caracteres'
    }),
    email: Joi.string().email().required().messages({
      'string.base': 'O e-mail deve ser uma string válida',
      'string.empty': 'O e-mail não pode estar vazio',
      'string.email': 'O e-mail deve ser um endereço de e-mail válido'
    }),
    password: Joi.string().min(6).regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/).required().messages({
      'string.base': 'A palavra-passe deve ser uma string válida',
      'string.empty': 'A palavra-passe não pode estar vazia',
      'string.min': 'A palavra-passe deve ter no mínimo {#limit} caracteres',
      'string.pattern.base': 'A palavra-passe deve conter pelo menos uma letra e um número'
    })
  });
  
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map((detail: ValidationErrorItem) => detail.message);
    return res.status(400).send({
      message: errorMessages[0],
      success: false
    });
  }
  
  // Criar novo User



  // Verificar se o email não está cadastrado
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user) {
      return res.status(500).send({
        success: false,
        message: "O email já está registado."

      })
    }
  } catch (error) {
    res.status(500).send(
      {
        success: false,
        message: "Erro ao verificar o email do utilizador: " + error
      }
    )
  }
  // Encriptar password
  const salt = await bcrypt.genSalt();
  req.body.password = await bcrypt.hash(req.body.password, salt);


  // Define o cargo padrão como 1 "Admin" (Mudar depois para 2 "User normal")
  req.body.cargo_id = 2;

  try {
    const data = await User.create(req.body);
    res.send({
      message: data,
      success: true

    });

  } catch (error) {
    res.status(500).send(
      {
        message: "Erro ao criar o utilizador: " + error,
        success: false
      })
  }
}



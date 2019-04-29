

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');
const Sequelize = require('sequelize');

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
   /* model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
    });
    rl.prompt();
*/
    models.quiz.findAll()
    .then(quizzes => {
    	quizzes.forEach(quiz => {
    		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    	});
    })
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    })

};

/**
* Validación de que id es correcto
*
*/
const idCorrecto = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>.`));
		} else{
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else{
				resolve(id);
			}
		}
	});
};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    
	idCorrecto(id)
	.then(id => models.quiz.findByPk(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}
		log(`[${colorize(quiz.id, "magenta")}]: ${quiz.question} ${colorize(" => ","magenta")} ${quiz.answer}`);
	})
	.catch(error => {
    errorlog(error.message);
    })
    .then(() => {
    rl.prompt();
    });  
};


/**
*
*Funcion que convierte las llamadas rl.question (callback) es Promesas
*
*/

const creadorPreguntas = (rl, texto) => {
	return new Sequelize.Promise((resolve,reject) => {
		rl.question(colorize(texto, "green"), answer => {
			resolve(answer.trim());
		});
	});
};



/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

	creadorPreguntas(rl, 'Introduzca una pregunta: ')
	.then(pregunta => {
		return creadorPreguntas(rl, 'Introduzca la respuesta: ')
		.then(respuesta => {
			return {question: pregunta, answer: respuesta};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize("Se ha añadido", "magenta")}: ${quiz.question} ${colorize(" => ","magenta")} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
    idCorrecto(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    idCorrecto(id)
    .then(id => models.quiz.findByPk(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return creadorPreguntas(rl, 'Introduzca la pregunta: ')
		.then(pregunta => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return creadorPreguntas(rl, 'Introduzca la respuesta: ')
			.then(respuesta => {
				quiz.question = pregunta;
				quiz.answer = respuesta;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(`Se ha cambiado el quiz ${colorize(quiz.id, "magenta")} por: ${quiz.question} ${colorize(" => ","magenta")} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    idCorrecto(id)
    .then(id => models.quiz.findByPk(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}

		return creadorPreguntas(rl, quiz.question+"  ")
		.then(respuesta => {
			if(respuesta.toLowerCase().trim() === quiz.answer.toLowerCase()){
            log(colorize('Su respuesta es correcta', 'green'));
            biglog('CORRECTO', 'green');   	
        } else{
           	log(colorize('Su respuesta es incorrecta', 'red'));
            biglog('INCORRECTO', 'red');   	
        }
        });
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
}
/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
	 let score = 0;
	 let idFaltan = [];
	 const playNext = () => {
	 
	 if(idFaltan.length === 0){
		 log("No hay mas que preguntar");
		 return;
	 }
	 
	 let pos = Math.floor(Math.random()*idFaltan.length);
	 let id = idFaltan[pos];
	 idFaltan.splice(pos,1);
	 return models.quiz.findByPk(id)
	 .then(quiz=>{
	 	return creadorPreguntas(rl, `${quiz.question} `)
	 	.then(answer=> {
	 
	 	if (answer.toLowerCase().trim() === quiz.answer.toLowerCase()) {
			score++;
			log(`Aciertos: ${score}`);
			biglog("Correcta", 'green');
			return playNext();
	     
		 } else {
		 log("Respuesta incorrecta");
		 biglog("Incorrecta",'red');
		 }
	 	})
	 })
	 }
	  
	 models.quiz.findAll({
	 attributes: ["id"],
	 raw: true
	})
	.then(quizzes=>{
	idFaltan = quizzes.map(quiz=>quiz.id);
	})
	.then(()=>playNext())
	.then(()=>{

	log(`Fin del juego. Aciertos: ${score}`);
	biglog(score, "magenta");
	  

	}).catch(error=>{
	console.log(error.message);
	}).then(()=>{
	rl.prompt();

	})
};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autor de la práctica:');
    log('Javier Palomares Torrecilla', 'green');
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};


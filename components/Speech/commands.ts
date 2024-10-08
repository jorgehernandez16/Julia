import { ref, watch } from 'vue-demi';
import type { SpeechRecognition, SpeechGrammarList } from './types';
import axios from 'axios';


const apikeyresume = '4c9f2875e1msh2d76d1c637fb2aep156b4ajsnddfc1b339847';
const apiKeyimage = '4c9f2875e1msh2d76d1c637fb2aep156b4ajsnddfc1b339847'; // Clave de RapidAPI
export var isListening = ref(false);
export var lastCommand = ref({});
export var lang = ref("es-ES");
export var recognition: SpeechRecognition;
export var speechRecognitionList: SpeechGrammarList;
export var grammar = "#JSGF V1.0; grammar commands; public <command> = julia | Julia | Leer párrafo | leer párrafo | resumen párrafo | describir imagen;";


const SpeechRecognition = window && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const SpeechGrammarList = window && ((window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList);

export const toggle = () => {
    console.log("toggle");
    isListening.value = !isListening.value;
};

export const initSpeechRecognize = () => {
    console.log("Start listening");

    recognition = new SpeechRecognition() as SpeechRecognition;
    speechRecognitionList = new SpeechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    recognition.continuous = false; // Cambiamos a no continuo para controlar cuándo iniciar y detener
    recognition.lang = lang.value;
    recognition.grammars = speechRecognitionList;

    recognition.onresult = (event) => {
        let command = '';
        for (let i = 0; i < event.results.length; i++) {
            command += event.results[i][0].transcript.toLowerCase().trim() + ' ';
        }
        const confidence = Math.floor(event.results[0][0].confidence * 10000) / 100;

        lastCommand.value = { command, confidence };

        // Detener el reconocimiento mientras se ejecuta el comando
        recognition.stop();

        // Ejecutar el comando y luego reiniciar la escucha
        executeCommand(command.trim()).then(() => {
            // Reiniciar la escucha después de ejecutar el comando
            if (isListening.value) {
                recognition.start();
            }
        });
    };

    recognition.onstart = () => {
        console.log("onstart");
    };

    recognition.onend = () => {
        console.log("onend");
        if (isListening.value) {
            // Reiniciar el reconocimiento solo si se sigue en modo de escucha
            recognition.start();
        }
    };

    recognition.onerror = (event) => {
        console.error("Error en el reconocimiento de voz:", event.error);
        if (event.error === 'no-speech') {
            recognition.start(); // Reiniciar si no se detectó discurso
        }
    };

    watch(isListening, () => {
        console.log("isListening", isListening.value);
        if (isListening.value) {
            recognition.start();
        } else {
            recognition.stop();
        }
    });
};

// Función para leer un párrafo en voz alta 
const leerParrafo = () => {
    return new Promise<void>((resolve) => {
        const parrafo = document.querySelector('p'); // Selecciona el primer párrafo de la página (ajustable)
        if (parrafo) {
            const speech = new SpeechSynthesisUtterance(parrafo.textContent || ""); // Se usa SpeechSynthesisUtterance para leer el párrafo

            speech.lang = lang.value;

            speech.onend = () => {
                resolve(); // Resolver la promesa cuando termine de leer el párrafo
            };

            window.speechSynthesis.speak(speech); // speak lee el "speech"
        } else {
            console.error("No se encontró ningún párrafo.");
            resolve(); // Si no se encontró el párrafo, resolver de todos modos
        }
    });
};

export const executeCommand = async (command: string) => {
    console.log("Comando recibido:", command);

    // Comprobamos si los comandos incluyen 'julia' y 'leer párrafo' juntos
    if (command.includes("julia") && command.includes("leer párrafo")) {
        console.warn("Comando activador 'Julia' y 'leer párrafo' detectado.");
        await leerParrafo(); // Esperamos a que termine de leer el párrafo
    }

    if (command.includes("julia") && command.includes("resumen párrafo")) {
        console.warn("Comando activador 'Julia' y 'resume párrafo' detectado.");
        await leerParrafoResumido(); // Esperamos a que termine de leer el párrafo
    }

    if (command.includes("julia") && command.includes("describir imagen")) {
        console.warn("Comando activador 'Julia' y 'describir imagen' detectado.");
        await getPhotoDescription(); // Esperamos a que termine de obtener la descripción

    }


    // Limpiar el comando para evitar que se repita
    resetCommand();
};

// Función para reiniciar los comandos después de ejecutarlos
const resetCommand = () => {
    lastCommand.value = {};
};



// Función para hacer una petición a la API de summarizer
const summarizeText = async (text: string, sentence: number) => {
    const options = {
        method: 'POST',  // La API de Summarizer espera una petición POST
        url: 'https://textanalysis-text-summarization.p.rapidapi.com/text-summarizer',
        headers: {
            'x-rapidapi-key': apikeyresume,
            'x-rapidapi-host': 'textanalysis-text-summarization.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            text: text,          // El texto que quieres resumir
            sentnum: sentence // Número de oraciones en el resumen
        }
    };

    try {
        const response = await axios.request(options);
        console.log('Resumen generado:', response.data);
        return response.data.summary;  // Devolver el resumen
    } catch (error) {
        console.error('Error al resumir el texto:', error);
        return 'Error al resumir el texto';  // Mensaje en caso de error
    }

};



const leerParrafoResumido = async () => {
    const parrafo = document.querySelector('p'); // Selecciona el primer párrafo de la página (ajustable)
    
    if (parrafo) {
        const textoOriginal = parrafo.textContent || ""; // Obtener el texto del párrafo
        const resumen = await summarizeText(textoOriginal, 3);  // Llamada a la API para resumir el texto
        console.log('Texto resumido:', resumen); // Mostrar el resumen en la consola

        const speech = new SpeechSynthesisUtterance(resumen); // Leer el texto resumido
        speech.lang = lang.value;

        window.speechSynthesis.speak(speech); // Ejecutar la lectura en voz alta
    } else {
        console.error("No se encontró ningún párrafo.");
    }
};


export const getPhotoDescription = async () => {
    const doccimg = document.querySelector('img'); // Selecciona la primer imagen de la página 

    if(!doccimg){ //Se comprueba si hay imagen en el DOM de no ser así, se da un mensaje de error
        console.error('No se encotró ninguna imagen en el DOM');
        return 'No encontró ninguna imagen para describir'              
    }

    const urlimagen = doccimg.src; //Obtener la URL de la imagen encontrada
    console.log('URL de la imagen: ', urlimagen);

    if (!urlimagen) { //Verificar si la URL que se encontró en la imagen es valida, si no, mostrar error
        console.error('No se pudo obtener la URL de la imagen.');
        return 'No se pudo obtener la URL de la imagen.';
    }
    

    const options = { //Configuracion de la API
        method: 'POST',
        url: 'https://ai-api-photo-description.p.rapidapi.com/description-from-url',
        headers: {
            'x-rapidapi-key': apiKeyimage,
            'x-rapidapi-host': 'ai-api-photo-description.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            url: urlimagen //Se le agrega la URL de la imagen a la data de la API
        }        
    }

        try {
        const response = await axios.request(options);
        // Comprobar si la respuesta contiene la descripción de la imagen
        if (response.data && response.data.caption) {
            const descripcion = response.data.caption;
            console.log('Descripción de la foto:', descripcion);

            // Leer en voz alta la descripción de la imagen
            const speech = new SpeechSynthesisUtterance(descripcion);
            speech.lang = lang.value;
            window.speechSynthesis.speak(speech);
        } else {
            console.error('No se obtuvo una descripción válida de la API.');
            return 'No se obtuvo una descripción válida de la imagen.';
        }
    }

       
            
        catch (error) {
           // Maneja cualquier error durante la solicitud
        console.error('Error al obtener la descripción de la foto:', error);
        return 'Error al obtener la descripción de la foto.';
        }

    };
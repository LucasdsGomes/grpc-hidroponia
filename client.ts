import { credentials, loadPackageDefinition } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

const array: any[] = [];
const portas: number[] = [3000, 3001, 3002];

const bancada = loadSync("./bancada.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const bancadaProto = loadPackageDefinition(bancada) as any;

function solicitaDadosBancadas() {
  let respostasRecebidas = 0;

  portas.forEach((porta, index) => {
    const client = new bancadaProto.bancada.TaskService(
      `localhost:${porta}`,
      credentials.createInsecure()
    );

    client.GerarBancada({}, (err: Error | null, response: any) => {
      if (err) {
        console.error(`Erro ao solicitar dados da porta ${porta}:`, err.message);
        return;
      }

      const dados = {
        temperatura: response.temperatura,
        umidade: response.umidade,
        condutividade: response.condutividade
      };

      array.push(dados);
      console.log(`Dados recebidos da bancada (porta ${porta}):\n- Temperatura: ${dados.temperatura}\n- Umidade: ${dados.umidade}\n- Condutividade: ${dados.condutividade}\n`);

      respostasRecebidas++;
      if (respostasRecebidas === portas.length) {
        EnviarDadosParaServidor();
      }
    });
  });
}

function EnviarDadosParaServidor() {
  const client = new bancadaProto.bancada.TaskService(
    "localhost:3003",
    credentials.createInsecure()
  );

  client.EnviaDados({ dados: array }, (err: Error | null, response: any) => {
    if (err) {
      console.error("Erro ao enviar dados para o servidor central:", err.message);
    } else {
      console.log("Resposta do Servidor Central:", response.mensagem);
    }
  });
}

solicitaDadosBancadas();
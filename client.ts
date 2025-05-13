import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const pacoteDefinicao = protoLoader.loadSync('./bancada.proto');
const grpcObject = grpc.loadPackageDefinition(pacoteDefinicao) as any;
const TaskService = grpcObject.bancada.TaskService;

const portas = [3000, 3001, 3002];

async function verificarBancadaAtiva(porta: number): Promise<boolean> {
  return new Promise((resolve) => {
    const cliente = new TaskService(
      `127.0.0.1:${porta}`,
      grpc.credentials.createInsecure()
    );

    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 1);

    cliente.waitForReady(deadline, (err: any) => {
      resolve(!err);
    });
  });
}

async function obterLeitura(porta: number) {
  const cliente = new TaskService(
    `127.0.0.1:${porta}`,
    grpc.credentials.createInsecure()
  );

  return new Promise((resolve) => {
    cliente.ObterLeitura({}, (err: any, resposta: any) => {
      if (err) {
        resolve(null);
      } else {
        console.log(`Leitura obtida da bancada ${porta}`);
        resolve({ ...resposta, bancada: porta });
      }
    });
  });
}

async function obterLeiturasAtivas() {
  const leituras: any[] = [];

  for (const porta of portas) {
    const estaAtiva = await verificarBancadaAtiva(porta);

    if (estaAtiva) {
      const leitura = await obterLeitura(porta);
      if (leitura) {
        leituras.push(leitura);
      }
    } else {
      console.log(`Bancada ${porta} está desativada - ignorando`);
    }
  }

  return leituras;
}

async function enviarParaServidor(leituras: any[]) {
  const cliente = new TaskService(
    '127.0.0.1:4000',
    grpc.credentials.createInsecure()
  );

  return new Promise((resolve) => {
    cliente.CalcularEstatisticas({ leituras }, (err: any, resposta: any) => {
      if (err || !resposta) {
        console.log('\nServidor de estatísticas indisponível.');
        resolve(null);
        return;
      }

      console.log('\n=== Estatísticas Calculadas ===');
      if (resposta.temperatura) {
        console.log('Média de Temperatura:', Math.floor(resposta.temperatura.media), '°C');
        console.log('Mediana de Temperatura:', resposta.temperatura.mediana, '°C');
      }
      console.log('============');
      if (resposta.umidade) {
        console.log('Média de Umidade:', Math.floor(resposta.umidade.media));
        console.log('Mediana de Umidade:', Math.floor(resposta.umidade.mediana));
      }
      console.log('============');
      if (resposta.condutividade) {
        console.log('Média de Condutividade:', Math.floor(resposta.condutividade.media));
        console.log('Mediana de Condutividade:', Math.floor(resposta.condutividade.mediana));
      }

      resolve(resposta);
    });

  });
}

(async () => {
  console.log('Verificando bancadas ativas...');

  const leituras = await obterLeiturasAtivas();

  if (leituras.length === 0) {
    console.log('Nenhuma bancada ativa encontrada.');
    return;
  }

  // Mostra leituras individuais independentemente do servidor de cálculo
  console.log('\n=== Leituras das Bancadas ===');
  leituras.forEach((leitura) => {
  console.log(`\nBancada ${leitura.bancada}:`);
  console.log(`Temperatura: ${Number(leitura.temperatura).toFixed(2)}°C`);
  console.log(`Umidade: ${Number(leitura.umidade).toFixed(2)}`);
  console.log(`Condutividade: ${Number(leitura.condutividade).toFixed(2)}`);
});


  // Tenta enviar para o servidor de cálculo (se não estiver disponível, continua normalmente)
  await enviarParaServidor(leituras);
})();
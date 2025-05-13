import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const pacoteDefinicao = protoLoader.loadSync('./bancada.proto');
const grpcObject = grpc.loadPackageDefinition(pacoteDefinicao) as any;
const TaskService = grpcObject.bancada.TaskService;

const servidor = new grpc.Server();

function calcularMedia(lista: number[]) {
  if (!lista || lista.length === 0) return 0;
  const soma = lista.reduce((a, b) => a + b, 0);
  return soma / lista.length;
}

function calcularMediana(lista: number[]) {
  if (!lista || lista.length === 0) return 0;


  const valoresValidos = lista.filter(valor => !isNaN(valor) && valor !== null && valor !== undefined);

  if (valoresValidos.length === 0) return 0;

  const ordenada = [...valoresValidos].sort((a, b) => a - b);
  const meio = Math.floor(ordenada.length / 2);

  return ordenada.length % 2 === 0 ?
    (ordenada[meio - 1] + ordenada[meio]) / 2 :
    ordenada[meio];
}

servidor.addService(TaskService.service, {
  CalcularEstatisticas: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    try {
      const leituras = call.request.leituras || [];

      // 1. Estatísticas INDIVIDUAIS por bancada
      const porBancada = leituras.map((leitura: any) => ({
        bancada: leitura.bancada,
        temperatura: {
          media: Math.floor(leitura.temperatura),
          mediana: Math.floor(leitura.temperatura)
        },
        umidade: {
          media: Math.floor(leitura.umidade),
          mediana: Math.floor(leitura.umidade)
        },
        condutividade: {
          media: Math.floor(leitura.condutividade),
          mediana: Math.floor(leitura.condutividade)
        }
      }));


      // 2. Estatísticas CONSOLIDADAS (todas bancadas combinadas)
      const extrairValores = (prop: string) => leituras
        .map((l: any) => l[prop])
        .filter((valor: number) => typeof valor === 'number');

      const estatisticasTotais = {
        temperatura: {
          media: Math.floor(calcularMedia(extrairValores('temperatura'))),
          mediana: Math.floor(calcularMediana(extrairValores('temperatura')))
        },
        umidade: {
          media: Math.floor(calcularMedia(extrairValores('umidade'))),
          mediana: Math.floor(calcularMediana(extrairValores('umidade')))
        },
        condutividade: {
          media: Math.floor(calcularMedia(extrairValores('condutividade'))),
          mediana: Math.floor(calcularMediana(extrairValores('condutividade')))
        }
      };

      callback(null, {
        porBancada,
        temperatura: estatisticasTotais.temperatura,
        umidade: estatisticasTotais.umidade,
        condutividade: estatisticasTotais.condutividade
      });


    } catch (error) {
      console.error('Erro:', error);
      callback({
        code: grpc.status.INTERNAL,
        details: 'Erro no processamento'
      }, null);
    }
  }
});

servidor.bindAsync('0.0.0.0:4000', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Servidor de cálculo rodando na porta 4000');
});
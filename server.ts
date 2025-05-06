import {
    loadPackageDefinition,
    Server,
    ServerCredentials,
    ServerUnaryCall,
    sendUnaryData
  } from '@grpc/grpc-js';
  import { loadSync } from '@grpc/proto-loader';
  
  const protoDef = loadSync('./bancada.proto');
  const bancadaProto = loadPackageDefinition(protoDef) as any;
  
  interface Hidroponia {
    temperatura: number;
    umidade: number;
    condutividade: number;
  }
  
  interface Resultado {
    medias: string;
    medianas: string;
  }
  
  function calcularMedias(array: Hidroponia[]) {
    const total = array.length;
    const soma = array.reduce((acc, item) => {
      acc.temperatura += item.temperatura;
      acc.umidade += item.umidade;
      acc.condutividade += item.condutividade;
      return acc;
    }, { temperatura: 0, umidade: 0, condutividade: 0 });
  
    return {
      temperatura: Number((soma.temperatura / total).toFixed(2)),
      umidade: Number((soma.umidade / total).toFixed(2)),
      condutividade: Number((soma.condutividade / total).toFixed(2))
    };
  }
  
  function calcularMediana(array: Hidroponia[]) {
    const getMediana = (valores: number[]) => {
      valores.sort((a, b) => a - b);
      const meio = Math.floor(valores.length / 2);
      if (valores.length % 2 === 0) {
        return Number(((valores[meio - 1] + valores[meio]) / 2).toFixed(2));
      } else {
        return valores[meio];
      }
    };
  
    const temperaturas = array.map(item => item.temperatura);
    const umidades = array.map(item => item.umidade);
    const condutividades = array.map(item => item.condutividade);
  
    return {
      temperatura: getMediana(temperaturas),
      umidade: getMediana(umidades),
      condutividade: getMediana(condutividades)
    };
  }
  
  const grpcServer = new Server();
  
  grpcServer.addService(bancadaProto.bancada.TaskService.service, {
    EnviaDados: (call: ServerUnaryCall<{ dados: Hidroponia[] }, Resultado>, callback: sendUnaryData<Resultado>) => {
      const dadosRecebidos = call.request.dados;
  
      const medias = calcularMedias(dadosRecebidos);
      const medianas = calcularMediana(dadosRecebidos);
  
      const resultado: Resultado = {
        medias: `
  - Temperatura: ${medias.temperatura}
  - Umidade: ${medias.umidade}
  - Condutividade: ${medias.condutividade}`,
        medianas: `
  - Temperatura: ${medianas.temperatura}
  - Umidade: ${medianas.umidade}
  - Condutividade: ${medianas.condutividade}`
      };
  
      callback(null, resultado);
    }
  });
  
  grpcServer.bindAsync('0.0.0.0:5050', ServerCredentials.createInsecure(), () => {
    console.log('Servidor gRPC rodando na porta 5050');
  });
  
function log(msg){
    console.log(msg)
}

cv['onRuntimeInitialized'] = function(){
    const inputImagem = document.querySelector('#inputImage');
    const btnAlterar = document.querySelector('#btnAlterar');
    const statusEl = document.querySelector('#status');
    let src;
    statusEl.textContent = 'OpenCV.js carregado. Selecione uma imagem';


    inputImagem.addEventListener('change', function(e){
        if(!e.target.files[0]) return;
        const img = document.createElement('img');
        img.src = URL.createObjectURL(e.target.files[0]);
        img.onload = () => {
            if(src) src.delete();
            src = cv.imread(img);
            cv.imshow('canvasOriginal', src);
            btnAlterar.disabled = false;
            statusEl.textContent = 'Imagem Carregada. Clique em Gerar Canvas'
        }
    })

    btnAlterar.addEventListener('click', function(){
        //cinza
        let cinza = new cv.Mat();
        cv.cvtColor(src, cinza, cv.COLOR_RGBA2GRAY);
        cv.imshow('canvasGray', cinza);
        cinza.delete();


        //HSV
        let rgb = new cv.Mat();
        let hsv = new cv.Mat();
        cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
        cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
        cv.imshow('canvasHSV', hsv);
        hsv.delete();



        //separar cada canal de RGB
        let canais = new cv.MatVector();
        cv.split(rgb, canais);
        cv.imshow('canvasR', canais.get(0));
        cv.imshow('canvasG', canais.get(1));
        cv.imshow('canvasB', canais.get(2));
        canais.delete();
        rgb.delete();



        // brilho +50 e contraste 1.3x
        let ajustado = new cv.Mat();
        cv.convertScaleAbs(src, ajustado, 1.3, 50);
        cv.imshow('canvasAjustado', ajustado);
        ajustado.delete();



        //regiao de interesse: recortar um retangulo
        if (src.cols > 50 && src.rows > 300){
            let rect = new cv.Rect(300, 50, 300, 100); // x, y(cima para baixo), largura, altura
            let roi = src.roi(rect);
            cv.imshow('canvasRecorte', roi)
            roi.delete();
        }
        



        //mascara
        let mascara = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1)
        let centro = new cv.Point(src.cols / 2, src.rows / 2);
        let raio = Math.min(src.cols, src.rows)/3;
        cv.circle(mascara, centro, raio, new cv.Scalar(255), -1);
        cv.imshow('canvasMascara', mascara);

        //recorte + AND - colorida apenas onde a mascara e branca
        let recorteAND = new cv.Mat();
        cv.bitwise_and(src, src, recorteAND, mascara)
        cv.imshow('canvasAND', recorteAND)
        recorteAND.delete();

        //recorte + OR - onde a mascara for branca ela sobrepoe(só deixa branco) a imagem
        let recorteOR = new cv.Mat();
        let mascaraRGBA = new cv.Mat();
        cv.cvtColor(mascara, mascaraRGBA, cv.COLOR_GRAY2RGBA);
        cv.bitwise_or(src, mascaraRGBA, recorteOR)
        cv.imshow('canvasOR', recorteOR)
        recorteOR.delete();

        //recorte + XOR - inverte as cores dentro da area branca da mascara
        let recorteXOR = new cv.Mat();
        let filtroAlfa = new cv.Mat(mascaraRGBA.rows, mascaraRGBA.cols, cv.CV_8UC4, new cv.Scalar(1, 1, 1, 0));
        let mascaraXOR = new cv.Mat();
        cv.multiply(mascaraRGBA, filtroAlfa, mascaraXOR);
        cv.bitwise_xor(src, mascaraXOR, recorteXOR)
        cv.imshow('canvasXOR', recorteXOR)
        recorteXOR.delete();
        mascaraRGBA.delete();

        //recorte + NOT - zera todos os bits da região da máscara
        let recorteNOT = new cv.Mat();
        let mascaraInvertida = new cv.Mat();
        cv.bitwise_not(mascara, mascaraInvertida)
        cv.bitwise_and(src, src, recorteNOT, mascaraInvertida);
        cv.imshow('canvasNOT', recorteNOT)
        recorteNOT.delete();
        mascaraInvertida.delete();
        mascara.delete();
        
        
        //Histograma(equalizacao)
        cinza = new cv.Mat();
        cv.cvtColor(src, cinza, cv.COLOR_RGBA2GRAY);
        let equalizada = new cv.Mat();
        cv.equalizeHist(cinza, equalizada);
        cv.imshow('canvasHistograma', equalizada);
        equalizada.delete();

        //Limiarizacao automatica (Otsu)
        let binaria = new cv.Mat();
        cv.threshold(
            cinza,
            binaria,
            0,
            255,
            cv.THRESH_BINARY + cv.THRESH_OTSU);
        cv.imshow('canvasBinaria', binaria);

        //Limiarizacao adaptativa (iluminacao irregular)
        let adaptativa = new cv.Mat();
        cv.adaptiveThreshold(
            cinza,
            adaptativa,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C, //metodo de media ponderada gaussiana dos pixels vizinhos
            cv.THRESH_BINARY, //resultado final - binario
            15, //blockSize - tamanho da regiao vizinha analisada - deve ser impar
            5); //constante c - valor subtraido da media para eliminar ruidos
        cv.imshow('canvasAdaptativa', adaptativa);
        adaptativa.delete();
        


        //rotular
        let rotulos = new cv.Mat();
        let stats = new cv.Mat();
        let centroids = new cv.Mat();
        let numComponents = cv.connectedComponentsWithStats(
            binaria,
            rotulos,
            stats,
            centroids,
            8,
            cv.CV_32S
        )
        log('Componentes encontrados: ' + numComponents);
        for (let i=1; i<numComponents; i++){
            let area = stats.intPtr(i, cv.CC_STAT_AREA)[0];
            log('Componente ' + i + ' tem área ' + area + ' pixels');
        }
        
        rotulos.delete();
        stats.delete();
        centroids.delete();

        //preenchimento por inundacao
        mascara = cv.Mat.zeros(src.rows + 2, src.cols + 2, cv.CV_8U);
        cv.cvtColor(src, cinza, cv.COLOR_RGBA2GRAY);
        let cor = new cv.Scalar(228, 0, 43, 255);
        let xCoord = Math.min(464, src.cols - 1);
        let yCoord = Math.min(50, src.rows - 1);
        let ponto = new cv.Point(xCoord, yCoord);
        let saidaColorida = new cv.Mat();
        cv.cvtColor(binaria, saidaColorida, cv.COLOR_GRAY2RGB);
        cv.floodFill(saidaColorida, mascara, ponto, cor);
        cv.imshow('canvasPreechimento', saidaColorida);
        binaria.delete();
        saidaColorida.delete();
        mascara.delete();

        statusEl.textContent = 'Conversão concluída!';
    })
}
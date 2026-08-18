cv['onRuntimeInitialized'] = function(){
    const inputImagem = document.querySelector('#inputImage');
    const btnCinza = document.querySelector('#btnCinza');
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
            btnCinza.disabled = false;
            statusEl.textContent = 'Imagem Carregada. Clique em Converter'
        }
    })

    btnCinza.addEventListener('click', function(){
        let cinza = new cv.Mat();
        cv.cvtColor(src, cinza, cv.COLOR_RGBA2GRAY);
        cv.imshow('canvasSaida', cinza);
        cinza.delete();

        let rgb = new cv.Mat();
        let hsv = new cv.Mat();
        cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
        cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);
        cv.imshow('canvasHSV', hsv);
        hsv.delete();

        let canais = new cv.MatVector();
        cv.split(rgb, canais);
        cv.imshow('canvasR', canais.get(0));
        cv.imshow('canvasG', canais.get(1));
        cv.imshow('canvasB', canais.get(2));
        rgb.delete();

        statusEl.textContent = 'Conversão concluída!';
    })
}
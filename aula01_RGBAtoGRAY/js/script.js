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
        statusEl.textContent = 'Conversão concluída!';
    })
}
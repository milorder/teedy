'use strict';

angular.module('docs').controller('FileModalView', function ($uibModalInstance, $scope, $state, $stateParams, $sce, Restangular, $transitions) {
  let imageObj = null;
  let rotation = 0;
  let cropRect = null;
  let isDragging = false;
  let drawing = false;

  $scope.isCropping = false;
  $scope.isDrawing = false;

  function getCanvasContext() {
    const canvas = document.getElementById('imageCanvas');
    return canvas ? { canvas, ctx: canvas.getContext('2d') } : {};
  }

  function clearCanvasEvents() {
    const { canvas } = getCanvasContext();
    if (!canvas) return;
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
  }

  function drawImageOnCanvas() {
    const { canvas, ctx } = getCanvasContext();
    if (!canvas || !ctx || !imageObj) return;

    let w = imageObj.width, h = imageObj.height;
    let angle = rotation % 360;

    canvas.width = (angle === 90 || angle === 270) ? h : w;
    canvas.height = (angle === 90 || angle === 270) ? w : h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    switch (angle) {
      case 90:
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        break;
      case 180:
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        break;
      case 270:
        ctx.translate(0, canvas.height);
        ctx.rotate(3 * Math.PI / 2);
        break;
    }

    ctx.drawImage(imageObj, 0, 0);
    ctx.restore();

    if ($scope.isCropping && cropRect) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    }
  }

  $scope.startCrop = function () {
    const { canvas } = getCanvasContext();
    if (!canvas) return;

    $scope.isCropping = true;
    $scope.isDrawing = false;
    cropRect = null;

    canvas.onmousedown = e => {
      const rect = canvas.getBoundingClientRect();
      cropRect = { x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 };
      isDragging = true;
    };

    canvas.onmousemove = e => {
      if (!isDragging || !$scope.isCropping || !cropRect) return;
      const rect = canvas.getBoundingClientRect();
      cropRect.w = e.clientX - rect.left - cropRect.x;
      cropRect.h = e.clientY - rect.top - cropRect.y;
      drawImageOnCanvas();
    };

    canvas.onmouseup = () => { isDragging = false; };
  };

  $scope.applyCrop = function () {
    const { canvas, ctx } = getCanvasContext();
    if (!cropRect || cropRect.w <= 0 || cropRect.h <= 0) return;

    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    canvas.width = cropRect.w;
    canvas.height = cropRect.h;
    ctx.putImageData(imageData, 0, 0);

    $scope.isCropping = false;
    clearCanvasEvents();
  };

  $scope.cancelCrop = function () {
    $scope.isCropping = false;
    cropRect = null;
    drawImageOnCanvas();
    clearCanvasEvents();
  };

  $scope.startDrawing = function () {
    const { canvas, ctx } = getCanvasContext();
    const indicator = document.getElementById('brushIndicator');
    if (!canvas || !ctx) return;

    $scope.isDrawing = true;
    $scope.isCropping = false;
    canvas.style.cursor = 'crosshair';
    if (indicator) indicator.style.display = 'block';

    canvas.onmousedown = e => {
      if (!$scope.isDrawing) return;
      drawing = true;
      const { left, top, width, height } = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo((e.clientX - left) * (canvas.width / width), (e.clientY - top) * (canvas.height / height));
    };

    canvas.onmousemove = e => {
      const { left, top, width, height } = canvas.getBoundingClientRect();
      const x = (e.clientX - left) * (canvas.width / width);
      const y = (e.clientY - top) * (canvas.height / height);

      if (indicator) {
        indicator.style.left = `${e.clientX - 4}px`;
        indicator.style.top = `${e.clientY - 4}px`;
      }

      if (drawing && $scope.isDrawing) {
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    canvas.onmouseup = () => { drawing = false; };
  };

  $scope.stopDrawing = function () {
    const { canvas } = getCanvasContext();
    const indicator = document.getElementById('brushIndicator');
    if (!canvas) return;

    $scope.isDrawing = false;
    canvas.style.cursor = 'default';
    if (indicator) indicator.style.display = 'none';
    clearCanvasEvents();
  };

  $scope.rotateImage = function () {
    const { canvas, ctx } = getCanvasContext();
    if (!canvas || !ctx) return;

    const tempImage = new Image();
    tempImage.src = canvas.toDataURL();

    tempImage.onload = () => {
      rotation = (rotation + 90) % 360;
      drawImageOnCanvas(tempImage);
    };
  };

  $scope.resetImage = function () {
    rotation = 0;
    drawImageOnCanvas();
  };

  $scope.saveImage = function () {
    const { canvas } = getCanvasContext();
    if (!canvas) return;

    const imageDataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageDataURL;
    link.download = ($scope.file?.name || 'edited') + '_edited.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function setFile(files) {
    files.forEach(file => {
      if (file.id === $stateParams.fileId) {
        $scope.file = file;
        $scope.trustedFileUrl = $sce.trustAsResourceUrl('../api/file/' + file.id + '/data');

        if (file.mimetype?.startsWith('image/')) {
          setTimeout(() => {
            imageObj = new Image();
            imageObj.crossOrigin = 'Anonymous';
            imageObj.onload = drawImageOnCanvas;
            imageObj.src = `../api/file/${file.id}/data?size=web`;
          }, 100);
        }
      }
    });
  }

  Restangular.one('file/list').get({ id: $stateParams.id }).then(data => {
    $scope.files = data.files;
    setFile(data.files);

    if (!$scope.file) {
      Restangular.one('file/' + $stateParams.fileId + '/versions').get().then(data => {
        setFile(data.files);
      });
    }
  });

  $scope.canDisplayPreview = function () {
    return $scope.file && $scope.file.mimetype !== 'application/pdf';
  };

  $scope.closeFile = function () {
    $uibModalInstance.dismiss();
  };
});



const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createSeamlessTexture(inputPath, options = {}) {
  const {
    outputDir = 'uploads/patterns/processed',
    targetSize = 512, 
    blendWidth = 0.15, 
    preserveColors = true,
    generateMipmaps = true,
    outputFormat = 'png'
  } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = path.basename(inputPath, path.extname(inputPath));
  const timestamp = Date.now();

  try {
    
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Original image: ${metadata.width}x${metadata.height}`);

    const resizedBuffer = await sharp(inputPath)
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const seamlessBuffer = await makeSeamless(resizedBuffer, targetSize, blendWidth);

    const optimizedBuffer = await optimizeForFabric(seamlessBuffer, {
      preserveColors,
      enhanceDetails: true
    });

    const seamlessFilename = `${filename}-seamless-${timestamp}.${outputFormat}`;
    const seamlessPath = path.join(outputDir, seamlessFilename);

    await sharp(optimizedBuffer)
      .png({ quality: 100, compressionLevel: 6 })
      .toFile(seamlessPath);

    console.log(`✅ Seamless texture created: ${seamlessPath}`);

    const mipmapPaths = {};
    if (generateMipmaps) {
      const sizes = [256, 128, 64];
      for (const size of sizes) {
        if (size < targetSize) {
          const mipmapFilename = `${filename}-seamless-${size}-${timestamp}.${outputFormat}`;
          const mipmapPath = path.join(outputDir, mipmapFilename);
          
          await sharp(optimizedBuffer)
            .resize(size, size)
            .png({ quality: 90 })
            .toFile(mipmapPath);
          
          mipmapPaths[size] = `/uploads/patterns/processed/${mipmapFilename}`;
        }
      }
    }

    return {
      success: true,
      originalPath: inputPath,
      seamlessPath: seamlessPath,
      seamlessUrl: `/uploads/patterns/processed/${seamlessFilename}`,
      size: targetSize,
      mipmaps: mipmapPaths,
      metadata: {
        width: targetSize,
        height: targetSize,
        format: outputFormat,
        isSeamless: true,
        isPowerOf2: true
      }
    };

  } catch (error) {
    console.error('❌ Error creating seamless texture:', error);
    return {
      success: false,
      error: error.message,
      originalPath: inputPath
    };
  }
}

async function makeSeamless(imageBuffer, size, blendWidthPercent) {
  const blendWidth = Math.floor(size * blendWidthPercent);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const width = info.width;
  const height = info.height;

  const output = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < blendWidth; x++) {
      const t = x / blendWidth; 
      const leftIdx = (y * width + x) * channels;
      const rightIdx = (y * width + (width - blendWidth + x)) * channels;

      for (let c = 0; c < channels; c++) {
        
        const leftVal = data[leftIdx + c];
        const rightVal = data[rightIdx + c];

        const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
        
        output[leftIdx + c] = Math.round(rightVal * (1 - smoothT) + leftVal * smoothT);
        output[rightIdx + c] = Math.round(leftVal * (1 - smoothT) + rightVal * smoothT);
      }
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < blendWidth; y++) {
      const t = y / blendWidth;
      const topIdx = (y * width + x) * channels;
      const bottomIdx = ((height - blendWidth + y) * width + x) * channels;

      for (let c = 0; c < channels; c++) {
        const topVal = output[topIdx + c];
        const bottomVal = output[bottomIdx + c];
        
        const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
        
        output[topIdx + c] = Math.round(bottomVal * (1 - smoothT) + topVal * smoothT);
        output[bottomIdx + c] = Math.round(topVal * (1 - smoothT) + bottomVal * smoothT);
      }
    }
  }

  return sharp(output, {
    raw: {
      width: width,
      height: height,
      channels: channels
    }
  }).png().toBuffer();
}

async function optimizeForFabric(imageBuffer, options = {}) {
  const { preserveColors = true, enhanceDetails = true } = options;

  let pipeline = sharp(imageBuffer);

  if (enhanceDetails) {
    
    pipeline = pipeline.sharpen({
      sigma: 0.5,
      m1: 0.5,
      m2: 0.5
    });
  }

  if (preserveColors) {
    
    pipeline = pipeline.toColorspace('srgb');
  }

  pipeline = pipeline.normalize();

  return pipeline.toBuffer();
}

function getRepeatRecommendation(garmentType, patternScale = 'medium') {
  const recommendations = {
    'coat': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'coat-men': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'coat-women': { repeatX: 3, repeatY: 4, scaleNote: 'Large garment, needs more repeats' },
    'blazer': { repeatX: 2.5, repeatY: 3.5, scaleNote: 'Medium-large garment' },
    'suit': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'suit-1': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'suit-2': { repeatX: 3, repeatY: 4, scaleNote: 'Full body coverage' },
    'barong': { repeatX: 2, repeatY: 3, scaleNote: 'Traditional shirt, moderate repeats' },
    'pants': { repeatX: 2, repeatY: 3, scaleNote: 'Lower body garment' },
    'shirt': { repeatX: 2, repeatY: 2.5, scaleNote: 'Standard shirt' },
    'default': { repeatX: 2, repeatY: 2, scaleNote: 'Default pattern repeat' }
  };

  const baseRepeat = recommendations[garmentType] || recommendations['default'];

  const scaleMultiplier = {
    'small': 1.5,  
    'medium': 1.0,
    'large': 0.6   
  }[patternScale] || 1.0;

  return {
    repeatX: baseRepeat.repeatX * scaleMultiplier,
    repeatY: baseRepeat.repeatY * scaleMultiplier,
    scaleNote: baseRepeat.scaleNote
  };
}

async function validateForFabricTexture(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    const issues = [];
    const recommendations = [];

    if (metadata.width < 256 || metadata.height < 256) {
      issues.push('Image is too small. Minimum 256x256 recommended.');
    }

    if (metadata.width !== metadata.height) {
      recommendations.push('Non-square image will be cropped to square for best tiling.');
    }

    const isPowerOf2 = (n) => n && (n & (n - 1)) === 0;
    if (!isPowerOf2(metadata.width) || !isPowerOf2(metadata.height)) {
      recommendations.push('Image will be resized to power-of-2 dimensions for GPU optimization.');
    }

    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
      issues.push(`Format ${metadata.format} may not be optimal. PNG or JPEG recommended.`);
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha
      }
    };

  } catch (error) {
    return {
      valid: false,
      issues: [`Cannot read image: ${error.message}`],
      recommendations: [],
      metadata: null
    };
  }
}

module.exports = {
  createSeamlessTexture,
  makeSeamless,
  optimizeForFabric,
  getRepeatRecommendation,
  validateForFabricTexture
};

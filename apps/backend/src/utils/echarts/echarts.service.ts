import { Injectable, Logger } from '@nestjs/common';
import { ChartRenderRequestType } from '@tet/domain/utils';
import { createCanvas } from 'canvas';
import type { ECharts, EChartsOption } from 'echarts/types/dist/echarts';
import { NextFunction, Response } from 'express';

@Injectable()
export class EchartsService {
  private readonly logger = new Logger(EchartsService.name);

  private readonly DEFAULT_FONT_SIZE = 20;

  private readonly DEVICE_PIXEL_RATIO = 3;

  /**
   * Ecma script module
   * @returns
   */
  async getEcharts(): Promise<any> {
    const echarts = await import('echarts');
    return echarts;
  }

  getChartFileName(request: ChartRenderRequestType): string {
    const chartOptions: EChartsOption = request.options;
    if (request.name) {
      return request.name;
    }
    if (chartOptions.title) {
      const chartFirstTitle = Array.isArray(chartOptions.title)
        ? chartOptions.title[0]
        : chartOptions.title;
      if (chartFirstTitle.text) {
        return chartFirstTitle.text;
      }
    }

    return 'chart';
  }

  async renderChart(
    request: ChartRenderRequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (request.format === 'png') {
        await this.renderToPng(request, res);
      } else if (request.format === 'svg') {
        await this.renderToSvg(request, res);
      }
    } catch (error) {
      next(error);
    }
  }

  async renderToPng(request: ChartRenderRequestType, res: Response) {
    const buffer = await this.renderToPngBuffer(request);

    // Set the output file name.
    res.attachment(`${this.getChartFileName(request)}.png`);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.writeHead(200, {
      'Content-Type': 'image/png',
    });
    res.write(buffer);
    res.end();
  }

  async renderToPngBuffer(
    request: Omit<ChartRenderRequestType, 'format' | 'name'>
  ): Promise<Buffer> {
    const echarts = await this.getEcharts();
    const canvas = createCanvas(request.width, request.height);

    // ECharts can use the Canvas instance created by node-canvas as a container directly
    let chart: ECharts | null = echarts.init(canvas, null, {
      width: request.width,
      height: request.height,
      devicePixelRatio: this.DEVICE_PIXEL_RATIO,
      renderer: 'canvas',
    });

    // setOption as normal
    chart?.setOption({
      ...request.options,
      animation: false,
      textStyle: { fontSize: this.DEFAULT_FONT_SIZE },
    });

    const buffer = canvas.toBuffer('image/png');

    // If chart is no longer useful, consider disposing it to release memory.
    chart?.dispose();
    chart = null;

    return buffer;
  }

  async renderToSvg(request: ChartRenderRequestType, res: Response) {
    const svgStr = await this.renderToSVGString(request);

    // Set the output file name.
    res.attachment(`${this.getChartFileName(request)}.svg`);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.writeHead(200, {
      'Content-Type': 'application/xml',
    });
    res.write(svgStr); // svgStr is the result of chart.renderToSVGString()
    res.end();
  }

  async renderToSVGString(request: ChartRenderRequestType): Promise<string> {
    const echarts = await this.getEcharts();

    // In SSR mode the first container parameter is not required
    let chart: ECharts | null = echarts.init(null, null, {
      renderer: 'svg', // must use SVG rendering mode
      ssr: true, // enable SSR
      width: request.width, // need to specify height and width
      height: request.height,
    });

    // use setOption as normal
    chart?.setOption({
      ...request.options,
      animation: false,
    });

    // Output a string
    const svgStr = chart?.renderToSVGString();

    // If chart is no longer useful, consider disposing it to release memory.
    chart?.dispose();
    chart = null;

    return svgStr ?? '';
  }
}

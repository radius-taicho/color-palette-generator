// 💼 **プロジェクト管理・バッチ処理ユーティリティ**

import JSZip from 'jszip';
import ColorThief from 'colorthief';
import { ColorProject, BatchProcessingJob, AdvancedExportOptions } from '../types/advanced';
import { ColorPalette, ColorInfo } from '../types/color';
import { evaluatePaletteWCAG, simulateColorBlindness, createAdvancedColorInfo } from './advancedColorUtils';

/**
 * 📁 **プロジェクト管理クラス**
 * 
 * 複数のカラーパレットを効率的に管理し、タグ機能やバージョン管理を提供
 * 
 * @example
 * const manager = new ProjectManager();
 * const project = manager.createProject('ブランドカラー', 'ECサイト用');
 * project = manager.addPalette(project.id, myPalette);
 */
export class ProjectManager {
  private projects: Map<string, ColorProject> = new Map();
  
  /**
   * 🆕 **新しいプロジェクトを作成**
   */
  createProject(name: string, description?: string, tags: string[] = []): ColorProject {
    const project: ColorProject = {
      id: this.generateProjectId(),
      name,
      description,
      palettes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags,
      isPublic: false
    };
    
    this.projects.set(project.id, project);
    this.saveToLocalStorage();
    
    return project;
  }
  
  /**
   * 📋 **全プロジェクトを取得**
   */
  getAllProjects(): ColorProject[] {
    return Array.from(this.projects.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }
  
  /**
   * 🔍 **プロジェクトを検索**
   */
  searchProjects(query: string, tags?: string[]): ColorProject[] {
    const allProjects = this.getAllProjects();
    
    return allProjects.filter(project => {
      const matchesQuery = !query || 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase());
      
      const matchesTags = !tags || tags.length === 0 ||
        tags.some(tag => project.tags.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  }
  
  /**
   * ➕ **パレットをプロジェクトに追加**
   */
  addPalette(projectId: string, palette: ColorPalette): ColorProject | null {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    project.palettes.push(palette);
    project.updatedAt = new Date();
    
    this.projects.set(projectId, project);
    this.saveToLocalStorage();
    
    return project;
  }
  
  /**
   * ❌ **パレットをプロジェクトから削除**
   */
  removePalette(projectId: string, paletteId: string): ColorProject | null {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    project.palettes = project.palettes.filter(p => p.id !== paletteId);
    project.updatedAt = new Date();
    
    this.projects.set(projectId, project);
    this.saveToLocalStorage();
    
    return project;
  }
  
  /**
   * 🏷️ **タグを追加**
   */
  addTags(projectId: string, newTags: string[]): ColorProject | null {
    const project = this.projects.get(projectId);
    if (!project) return null;
    
    const uniqueTags = [...new Set([...project.tags, ...newTags])];
    project.tags = uniqueTags;
    project.updatedAt = new Date();
    
    this.projects.set(projectId, project);
    this.saveToLocalStorage();
    
    return project;
  }
  
  /**
   * 💾 **ローカルストレージに保存**
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const data = JSON.stringify(Array.from(this.projects.entries()));
      localStorage.setItem('colorProjects', data);
    }
  }
  
  /**
   * 📥 **ローカルストレージから読み込み**
   */
  loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('colorProjects');
      if (data) {
        const entries = JSON.parse(data);
        this.projects = new Map(entries.map(([id, project]: [string, any]) => [
          id,
          {
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt)
          }
        ]));
      }
    }
  }
  
  /**
   * 🆔 **プロジェクトID生成**
   */
  private generateProjectId(): string {
    return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * ⚡ **バッチ処理エンジン**
 * 
 * 複数の画像から一括でカラーパレットを抽出し、
 * WCAGチェックや色覚多様性テストも並行実行
 * 
 * @example
 * const processor = new BatchProcessor();
 * const job = processor.createJob('デザイン素材', files, {
 *   paletteSize: 5,
 *   includeWCAG: true,
 *   includeColorBlindness: true
 * });
 */
export class BatchProcessor {
  private jobs: Map<string, BatchProcessingJob> = new Map();
  private colorThief = new ColorThief();
  
  /**
   * 🆕 **バッチジョブを作成**
   */
  createJob(
    name: string,
    images: File[],
    options: BatchProcessingJob['options']
  ): BatchProcessingJob {
    const job: BatchProcessingJob = {
      id: this.generateJobId(),
      name,
      images,
      options,
      status: 'pending',
      progress: 0,
      results: [],
      createdAt: new Date()
    };
    
    this.jobs.set(job.id, job);
    return job;
  }
  
  /**
   * ▶️ **バッチ処理を開始**
   */
  async startProcessing(jobId: string, progressCallback?: (progress: number) => void): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');
    
    job.status = 'processing';
    job.progress = 0;
    job.results = [];
    
    try {
      for (let i = 0; i < job.images.length; i++) {
        const image = job.images[i];
        
        // 🎨 **画像からパレット抽出**
        const palette = await this.extractPaletteFromImage(image, job.options);
        
        let wcagResults;
        let colorBlindnessResult;
        
        // 🔍 **WCAGチェック（オプション）**
        if (job.options.includeWCAG) {
          wcagResults = evaluatePaletteWCAG(palette.colors);
        }
        
        // 👁️ **色覚多様性テスト（オプション）**
        if (job.options.includeColorBlindness) {
          colorBlindnessResult = simulateColorBlindness(palette.colors);
        }
        
        // 📊 **結果を記録**
        job.results!.push({
          imageUrl: URL.createObjectURL(image),
          palette,
          wcag: wcagResults,
          colorBlindness: colorBlindnessResult
        });
        
        // 📈 **進捗更新**
        job.progress = Math.round(((i + 1) / job.images.length) * 100);
        this.jobs.set(jobId, job);
        
        if (progressCallback) {
          progressCallback(job.progress);
        }
      }
      
      job.status = 'completed';
    } catch (error) {
      job.status = 'error';
      console.error('Batch processing error:', error);
    }
    
    this.jobs.set(jobId, job);
  }
  
  /**
   * 🎨 **画像からパレット抽出**
   */
  private async extractPaletteFromImage(file: File, options: BatchProcessingJob['options']): Promise<ColorPalette> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let colors: number[][];
          
          // 🧮 **アルゴリズム選択**
          switch (options.algorithm) {
            case 'kmeans':
              colors = this.colorThief.getPalette(img, options.paletteSize, 10);
              break;
            case 'median-cut':
              colors = this.colorThief.getPalette(img, options.paletteSize, 1);
              break;
            case 'octree':
            default:
              colors = this.colorThief.getPalette(img, options.paletteSize, 5);
              break;
          }
          
          // 🎨 **ColorInfoオブジェクトに変換**
          const colorInfos: ColorInfo[] = colors.map(([r, g, b], index) => 
            createAdvancedColorInfo(r, g, b)
          );
          
          const palette: ColorPalette = {
            id: this.generatePaletteId(),
            name: `${file.name}のパレット`,
            colors: colorInfos,
            createdAt: new Date(),
            imageUrl: URL.createObjectURL(file)
          };
          
          resolve(palette);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * 📊 **ジョブ状況を取得**
   */
  getJob(jobId: string): BatchProcessingJob | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * 📋 **全ジョブを取得**
   */
  getAllJobs(): BatchProcessingJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  /**
   * 🆔 **ジョブID生成**
   */
  private generateJobId(): string {
    return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * 🆔 **パレットID生成**
   */
  private generatePaletteId(): string {
    return 'palette_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

/**
 * 📤 **高度エクスポート機能**
 * 
 * 様々な形式でパレットをエクスポート、WCAG情報や色覚テスト結果も含める
 * 
 * @example
 * const exporter = new AdvancedExporter();
 * const zipBlob = await exporter.exportPalette(palette, {
 *   format: 'lab',
 *   includeWCAG: true,
 *   compression: 'zip'
 * });
 */
export class AdvancedExporter {
  /**
   * 📦 **パレットをエクスポート**
   */
  async exportPalette(
    palette: ColorPalette,
    options: AdvancedExportOptions
  ): Promise<Blob> {
    const files: { [filename: string]: string } = {};
    
    // 🎨 **メインパレットファイル**
    files[`${palette.name}.${options.fileType}`] = this.generateMainFile(palette, options);
    
    // 🔍 **WCAGレポート（オプション）**
    if (options.includeWCAG) {
      const wcagResults = evaluatePaletteWCAG(palette.colors);
      files[`${palette.name}_wcag_report.json`] = JSON.stringify(wcagResults, null, 2);
    }
    
    // 👁️ **色覚多様性レポート（オプション）**
    if (options.includeColorBlindness) {
      const colorBlindnessResult = simulateColorBlindness(palette.colors);
      files[`${palette.name}_colorblindness_report.json`] = JSON.stringify(colorBlindnessResult, null, 2);
    }
    
    // 🧪 **LAB値（オプション）**
    if (options.includeLAB) {
      const labData = palette.colors.map(color => ({
        name: color.name,
        hex: color.hex,
        lab: createAdvancedColorInfo(color.rgb.r, color.rgb.g, color.rgb.b).lab
      }));
      files[`${palette.name}_lab_values.json`] = JSON.stringify(labData, null, 2);
    }
    
    // 📦 **圧縮またはテキスト出力**
    if (options.compression === 'zip') {
      return this.createZipFile(files);
    } else {
      // 単一ファイルの場合はメインファイルのみ
      const mainContent = files[`${palette.name}.${options.fileType}`];
      return new Blob([mainContent], { type: 'text/plain' });
    }
  }
  
  /**
   * 📝 **メインファイル生成**
   */
  private generateMainFile(palette: ColorPalette, options: AdvancedExportOptions): string {
    switch (options.fileType) {
      case 'json':
        return this.generateJSON(palette, options);
      case 'css':
        return this.generateCSS(palette, options);
      case 'scss':
        return this.generateSCSS(palette, options);
      case 'ase':
        return this.generateASE(palette, options);
      case 'text':
      default:
        return this.generateText(palette, options);
    }
  }
  
  /**
   * 📄 **JSON形式生成**
   */
  private generateJSON(palette: ColorPalette, options: AdvancedExportOptions): string {
    const data = {
      name: palette.name,
      id: palette.id,
      created: palette.createdAt,
      colors: palette.colors.map((color, index) => {
        const result: any = {
          name: options.customNames?.[index] || color.name,
          hex: color.hex
        };
        
        // 🎨 **形式別の値を追加**
        switch (options.format) {
          case 'rgb':
            result.rgb = color.rgb;
            break;
          case 'hsl':
            result.hsl = color.hsl;
            break;
          case 'lab':
            const advancedColor = createAdvancedColorInfo(color.rgb.r, color.rgb.g, color.rgb.b);
            result.lab = advancedColor.lab;
            break;
          case 'lch':
            const advancedColorLch = createAdvancedColorInfo(color.rgb.r, color.rgb.g, color.rgb.b);
            result.lch = advancedColorLch.lch;
            break;
        }
        
        return result;
      })
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * 🎨 **CSS形式生成**
   */
  private generateCSS(palette: ColorPalette, options: AdvancedExportOptions): string {
    const cssVars = palette.colors.map((color, index) => {
      const name = options.customNames?.[index] || `color-${index + 1}`;
      const cssName = name.toLowerCase().replace(/\s+/g, '-');
      
      let value = color.hex;
      if (options.format === 'rgb') {
        value = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
      } else if (options.format === 'hsl') {
        value = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
      }
      
      return `  --${cssName}: ${value};`;
    }).join('\n');
    
    return `:root {\n${cssVars}\n}\n\n/* Generated from palette: ${palette.name} */`;
  }
  
  /**
   * 💎 **SCSS形式生成**
   */
  private generateSCSS(palette: ColorPalette, options: AdvancedExportOptions): string {
    const scssVars = palette.colors.map((color, index) => {
      const name = options.customNames?.[index] || `color-${index + 1}`;
      const scssName = name.toLowerCase().replace(/\s+/g, '-');
      return `$${scssName}: ${color.hex};`;
    }).join('\n');
    
    return `// Generated from palette: ${palette.name}\n${scssVars}`;
  }
  
  /**
   * 📝 **テキスト形式生成**
   */
  private generateText(palette: ColorPalette, options: AdvancedExportOptions): string {
    const lines = [`Palette: ${palette.name}`, `Generated: ${new Date().toISOString()}`, ''];
    
    palette.colors.forEach((color, index) => {
      const name = options.customNames?.[index] || color.name;
      lines.push(`${index + 1}. ${name}`);
      lines.push(`   HEX: ${color.hex}`);
      lines.push(`   RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`);
      lines.push(`   HSL: ${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`);
      lines.push('');
    });
    
    return lines.join('\n');
  }
  
  /**
   * 🎨 **Adobe ASE形式生成（簡易版）**
   */
  private generateASE(palette: ColorPalette, options: AdvancedExportOptions): string {
    // ASEは実際にはバイナリ形式ですが、ここでは簡易的にテキスト表現
    return `Adobe ASE Color Palette\n${palette.name}\n\n` +
           palette.colors.map(color => `${color.name}: ${color.hex}`).join('\n');
  }
  
  /**
   * 📦 **ZIPファイル作成**
   */
  private async createZipFile(files: { [filename: string]: string }): Promise<Blob> {
    const zip = new JSZip();
    
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    return zip.generateAsync({ type: 'blob' });
  }
}

// 🎯 **インスタンス作成用のファクトリー関数**

/**
 * 💼 **プロジェクトマネージャーのシングルトンインスタンス**
 */
let projectManagerInstance: ProjectManager | null = null;

export function getProjectManager(): ProjectManager {
  if (!projectManagerInstance) {
    projectManagerInstance = new ProjectManager();
    projectManagerInstance.loadFromLocalStorage();
  }
  return projectManagerInstance;
}

/**
 * ⚡ **バッチプロセッサーのファクトリー**
 */
export function createBatchProcessor(): BatchProcessor {
  return new BatchProcessor();
}

/**
 * 📤 **エクスポーターのファクトリー**
 */
export function createAdvancedExporter(): AdvancedExporter {
  return new AdvancedExporter();
}

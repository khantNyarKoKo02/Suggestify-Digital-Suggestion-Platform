import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Copy, Download, QrCode, Share2, Printer, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import QRCodeLib from 'qrcode'

interface QRCodeGeneratorProps {
  boxId: string
  onClose: () => void
}

type QRSize = '128' | '256' | '512' | '1024'
type QRFormat = 'png' | 'svg'

export function QRCodeGenerator({ boxId, onClose }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrSvg, setQrSvg] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrSize, setQrSize] = useState<QRSize>('512')
  const [qrFormat, setQrFormat] = useState<QRFormat>('png')
  const [customMessage, setCustomMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const submissionUrl = `${window.location.origin}/submit/${boxId}`
  const displayUrl = submissionUrl.replace('https://', '').replace('http://', '')
  
  console.log('QR Code Generator - boxId:', boxId)
  console.log('QR Code Generator - submissionUrl:', submissionUrl)
  console.log('QR Code Generator - window.location.origin:', window.location.origin)

  useEffect(() => {
    generateQRCode()
  }, [qrSize, qrFormat, customMessage])

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      const qrData = submissionUrl
      const size = parseInt(qrSize)
      
      const options = {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const
      }

      if (qrFormat === 'png') {
        const dataUrl = await QRCodeLib.toDataURL(qrData, options)
        setQrDataUrl(dataUrl)
        
        // Also generate to canvas for better download control
        if (canvasRef.current) {
          await QRCodeLib.toCanvas(canvasRef.current, qrData, options)
        }
      } else {
        const svg = await QRCodeLib.toString(qrData, { ...options, type: 'svg' })
        setQrSvg(svg)
      }
    } catch (error) {
      console.error('QR code generation error:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(submissionUrl)
      toast.success('URL copied to clipboard!')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = submissionUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('URL copied to clipboard!')
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    
    if (qrFormat === 'png') {
      if (canvasRef.current) {
        link.download = `suggestion-box-qr-${boxId}-${qrSize}px.png`
        link.href = canvasRef.current.toDataURL('image/png')
      } else {
        link.download = `suggestion-box-qr-${boxId}-${qrSize}px.png`
        link.href = qrDataUrl
      }
    } else {
      const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      link.download = `suggestion-box-qr-${boxId}-${qrSize}px.svg`
      link.href = url
    }
    
    link.click()
    
    if (qrFormat === 'svg') {
      setTimeout(() => URL.revokeObjectURL(link.href), 100)
    }
    
    toast.success(`QR code downloaded as ${qrFormat.toUpperCase()}!`)
  }

  const printQRCode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to print QR code')
      return
    }

    const qrImage = qrFormat === 'png' ? 
      `<img src="${qrDataUrl}" style="width: ${qrSize}px; height: ${qrSize}px;" alt="QR Code" />` :
      qrSvg

    printWindow.document.write(`
      <html>
        <head>
          <title>Suggestion Box QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            .qr-container { 
              margin: 20px 0; 
            }
            .url { 
              font-size: 12px; 
              color: #666; 
              margin-top: 10px;
              word-break: break-all;
            }
            .instructions {
              font-size: 14px;
              margin-top: 20px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <h2>Suggestion Box</h2>
          <div class="qr-container">${qrImage}</div>
          <div class="url">${displayUrl}</div>
          <div class="instructions">
            <p>Scan this QR code to submit anonymous feedback</p>
            ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    
    toast.success('QR code sent to printer!')
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        // Convert QR code to blob for sharing
        if (canvasRef.current) {
          canvasRef.current.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `suggestion-box-qr-${boxId}.png`, { type: 'image/png' })
              await navigator.share({
                title: 'Suggestion Box',
                text: `Submit anonymous feedback: ${displayUrl}`,
                files: [file]
              })
              toast.success('QR code shared!')
            }
          })
        }
      } catch (error) {
        // Fallback to copying URL
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Generator
          </DialogTitle>
          <DialogDescription>
            Generate and customize QR codes for your suggestion box
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate QR Code</TabsTrigger>
            <TabsTrigger value="share">Share & Use</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">QR Code Size</Label>
                <Select value={qrSize} onValueChange={(value: QRSize) => setQrSize(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128x128 (Small)</SelectItem>
                    <SelectItem value="256">256x256 (Medium)</SelectItem>
                    <SelectItem value="512">512x512 (Large)</SelectItem>
                    <SelectItem value="1024">1024x1024 (Extra Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="format">Format</Label>
                <Select value={qrFormat} onValueChange={(value: QRFormat) => setQrFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (Raster)</SelectItem>
                    <SelectItem value="svg">SVG (Vector)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Custom Message (for printing)</Label>
              <Input
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g., Share your thoughts about our service"
                className="mt-1"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {qrFormat === 'png' ? (
                      <div>
                        <img 
                          src={qrDataUrl} 
                          alt="QR Code for suggestion box"
                          className="mx-auto border"
                          style={{ width: Math.min(parseInt(qrSize), 300), height: Math.min(parseInt(qrSize), 300) }}
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                        className="mx-auto border"
                        style={{ width: Math.min(parseInt(qrSize), 300), height: Math.min(parseInt(qrSize), 300) }}
                      />
                    )}
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="secondary">{qrSize}×{qrSize}px</Badge>
                      <Badge variant="secondary">{qrFormat.toUpperCase()}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={downloadQRCode} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  
                  <Button onClick={printQRCode} variant="outline" className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  
                  <Button onClick={shareQRCode} variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Direct Link</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                    {submissionUrl}
                  </code>
                  <Button onClick={copyToClipboard} size="sm" variant="outline" aria-label="Copy URL">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Copy URL</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Usage Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium mb-1">For Physical Display:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Print the QR code and post it in visible locations</li>
                      <li>Recommended size: 512px or larger for easy scanning</li>
                      <li>Include the custom message for context</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded">
                    <p className="font-medium mb-1">For Digital Sharing:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Share via email, social media, or messaging apps</li>
                      <li>Include the direct URL as a backup</li>
                      <li>QR codes work on any smartphone camera app</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="font-medium mb-1">Best Practices:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Test the QR code before distribution</li>
                      <li>Ensure good contrast and clean printing</li>
                      <li>All submissions are completely anonymous</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

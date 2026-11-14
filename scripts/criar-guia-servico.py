from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

destino = Path("public/guia-servicos-petflow.pdf")
destino.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(destino), pagesize=A4)
w, h = A4
verde = colors.HexColor("#064A37")
dourado = colors.HexColor("#B78A34")

c.setFillColor(verde)
c.rect(0, h - 150, w, 150, fill=1, stroke=0)
c.setFillColor(dourado)
c.setFont("Helvetica-Bold", 14)
c.drawString(52, h - 68, "MVI PETFLOW | PETCARE")
c.setFillColor(colors.white)
c.setFont("Helvetica-Bold", 24)
c.drawString(52, h - 108, "Orientações após a compra")

c.setFillColor(verde)
c.setFont("Helvetica-Bold", 13)
c.drawString(52, h - 196, "Seu serviço PetCare")
c.setFillColor(colors.HexColor("#24362F"))
c.setFont("Helvetica", 11)
linhas = [
    "Este documento acompanha os serviços vendidos no site MVI PetFlow.",
    "Ele não é comprovante de pagamento nem confirma um agendamento.",
    "Consulte o email da compra para verificar o serviço e o valor adquiridos.",
    "Entre em contato para combinar local, data e detalhes do atendimento:",
    "WhatsApp: +55 41 99620-8327",
    "Área de atendimento: litoral, Curitiba e região metropolitana.",
    "Vacinação e demais procedimentos dependem de avaliação e indicação",
    "profissional, além da disponibilidade do serviço no local combinado.",
    "Informe ao atendimento o número do pedido recebido após a compra.",
]
y = h - 228
for linha in linhas:
    c.drawString(52, y, linha)
    y -= 24

c.setStrokeColor(dourado)
c.line(52, 110, w - 52, 110)
c.setFillColor(verde)
c.setFont("Helvetica-Bold", 10)
c.drawString(52, 88, "Dr. Francesco Carboni | Médico Veterinário | CRMV-PR 5622")
c.setFont("Helvetica", 9)
c.drawString(52, 70, "www.mvipetcare.net")
c.save()
print(destino)

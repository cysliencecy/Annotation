from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.5), Inches(11)
sec.top_margin = sec.bottom_margin = Inches(.48)
sec.left_margin = sec.right_margin = Inches(.6)
for name, size in [('Normal',10.5),('Title',20),('Heading 1',11.5)]:
    st = doc.styles[name]
    st.font.name = 'Microsoft YaHei'
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor(0,0,0)
    st.element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'Microsoft YaHei')
    st.paragraph_format.space_after = Pt(3)
    st.paragraph_format.line_spacing = 1.05
doc.styles['Heading 1'].paragraph_format.space_before = Pt(6)
doc.styles['Title'].paragraph_format.space_after = Pt(5)
def p(t):
    return doc.add_paragraph(t)
def h(t):
    doc.add_paragraph(t,'Heading 1')
doc.add_paragraph('AI 识图能力验证任务卡','Title')
p('状态：准备测试，暂无结果　｜　拟测模型：GLM-4.6V-Flash')
h('1 验证背景与目标')
p('【已确定】我是一名前端开发，通过项目学习 AI 产品经理技能。小程序拍照后显示最多 5 个物体的英文标签，点击查看中文名称和简短解释。本轮验证技术能力能否支撑体验，不代表用户需求已被验证；暂不验证热量、收藏、图鉴、同步。')
h('2 待验证假设')
p('① 多且分散的食物：能分别识别预先选定的主要食物，名称与位置对应，无重复。\n② 日常随手拍：能识别主要物体，中英文一致，标签指向正确对象。\n③ 难辨肉类：能使用有依据的大类（如“烤肉”），不无依据猜测具体肉种。\n④ 输出可用：每图不超过 5 个对象，名称、解释、坐标齐全，格式可直接读取。')
h('3 测试样本与操作步骤')
p('【已确定】9 张真实照片，三类场景各 3 张；先手动上传检查回答，再用最小测试页把坐标画回原图。9 张仅用于初步排查，不代表模型整体效果。')
p('【建议】① 编号照片，预先写下主要对象（最多 5 个）、可接受大类及不确定细节。\n② 固定提示词逐图上传，要求 JSON 包含中文名、英文名、简短中文解释、x、y；建议左上角为原点，x 向右、y 向下，范围 0～1，表示标签锚点。\n③ 保存原始回答，按下表逐图检查，不手改回答帮助其通过。\n④ 将同一输出绘制到原图，检查对象对应和重叠；异常时先核实缩放与坐标换算。\n⑤ 改提示词后记录版本，重跑全部 9 张，检查旧问题与新增问题。')
h('4 各维度判断标准')
p('逐图逐维度标记：通过＝已检查且满足标准；失败＝有明确反例；待核实＝已检查但证据不足或原因不明；未验证＝尚未检查。后两项不能算通过。')
rows = [
('维度','如何检查及通过标准','明确失败示例'),
('中文名与对象','对照预设清单，无漏识、重复或虚构；允许约定大类。','漏主要对象、猜具体肉种'),
('英文名','与中文指同一对象，拼写及常见表达正确；疑问查词典。','中英不符、拼写错误'),
('简短解释','建议一句中文，易理解，不添加图片无法支持的信息。','编造原料、产地等'),
('位置与标签','画回原图后，锚点在对应对象内，标签指向清楚。','指错对象、重叠难辨'),
('数量与格式','对象数≤5；字段齐全；坐标数值及范围正确；页面可解析。','超量、缺字段、越界、解析失败')]
table = doc.add_table(rows=0, cols=3)
table.autofit = False
for c,w in zip(table.columns,[1.05,4.35,1.9]): c.width = Inches(w)
for i,row in enumerate(rows):
    cells=table.add_row().cells
    for cell,txt,w in zip(cells,row,[1.05,4.35,1.9]):
        cell.width=Inches(w)
        cell.text=txt
        cell.vertical_alignment=1
        pr=cell._tc.get_or_add_tcPr()
        margins=OxmlElement('w:tcMar')
        for edge in ['top','left','bottom','right']:
            e=OxmlElement('w:'+edge); e.set(qn('w:w'),'65'); e.set(qn('w:type'),'dxa'); margins.append(e)
        pr.append(margins)
        if i==0:
            shade=OxmlElement('w:shd'); shade.set(qn('w:fill'),'E8EEF4'); pr.append(shade)
        for para in cell.paragraphs:
            para.paragraph_format.space_after=Pt(0)
            for r in para.runs:
                r.font.size=Pt(9)
                r.bold=i==0
    trpr=table.rows[-1]._tr.get_or_add_trPr()
    trpr.append(OxmlElement('w:cantSplit'))
borders=OxmlElement('w:tblBorders')
for edge in ['top','left','bottom','right','insideH','insideV']:
    e=OxmlElement('w:'+edge); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'4'); e.set(qn('w:color'),'D9D9D9'); borders.append(e)
table._tbl.tblPr.append(borders)
h('5 结果对应的产品决策')
p('【建议的暂定门槛】9 张均完成两阶段检查，无已确认的主要对象误识或漏识、无依据细分类猜测，且标签对应清楚、格式可读，再扩大样本。理由：这些问题直接破坏核心体验；此门槛不是准确率承诺或上线标准。')
p('【建议】定位失败：排查坐标换算，仍不稳定则考虑图下词汇列表；细分类不可靠：限制到大类；格式失败：增加约束与校验后回测；核心错误反复出现：缩小场景或对比模型；有待核实或未验证项：补证据与测试后再判断。')
h('6 测试后保留的记录')
p('照片及编号、预设对象清单、模型与可见配置、提示词版本、测试时间、原始输出、回绘截图、各维度状态和错误说明、复测记录、产品决策。')
p('【待确认 不阻碍开始】解释字数、标签样式、响应时间和成本的验收要求；未检查项记为“未验证”。')
out=Path(__file__).parent/'AI识图能力验证任务卡.docx'
doc.save(out)
print(out)

import Viewer3D from './Viewer3D';

export default function ReviewPage({ garment, colors, fabric, pattern, style, measurements, personalization, designImage, notes, onBack, onSubmit }) {

    const getPrice = () => {
        switch (fabric) {
            case 'silk': return 3000;
            case 'wool': return 2500;
            case 'linen': return 2700;
            case 'cotton': return 1000;
            default: return 3000;
        }
    };

    const price = getPrice();

    return (
        <div className="review-page" style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
            <h2>Order Review</h2>

            <div style={{ flex: 1, display: 'flex', gap: 20 }}>
                <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                    <Viewer3D
                        garment={garment}
                        colors={colors}
                        fabric={fabric}
                        pattern={pattern}
                        style={style}
                        measurements={measurements}
                        personalization={personalization}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3>Summary</h3>
                    <p><strong>Garment:</strong> {garment}</p>
                    <p><strong>Fabric:</strong> {fabric}</p>
                    <p><strong>Pattern:</strong> {pattern}</p>

                    {designImage && (
                        <div style={{ marginTop: 20 }}>
                            <strong>Uploaded Design:</strong>
                            <img src={designImage} alt="Design" style={{ display: 'block', maxWidth: '100%', maxHeight: 200, marginTop: 10, borderRadius: 4 }} />
                        </div>
                    )}

                    {notes && (
                        <div style={{ marginTop: 20 }}>
                            <strong>Notes:</strong>
                            <p style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10, borderRadius: 4 }}>{notes}</p>
                        </div>
                    )}

                    <div style={{ marginTop: 30, padding: 20, background: '#e6f7ff', borderRadius: 8 }}>
                        <h3>Total Price</h3>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#0050b3' }}>
                            ₱ {price.toLocaleString()}
                        </div>
                        <small>Based on {fabric} fabric selection</small>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={onBack} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Back to Edit</button>
                <button onClick={onSubmit} style={{ padding: '10px 20px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit Order</button>
            </div>
        </div>
    );
}

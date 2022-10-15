import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

function renderSoldItems(items) {
  return (
    <>
      <h2>Sold</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item, idx) => (
          <Col key={idx} className="overflow-hidden">
            <Card>
            <video controls>
              <source src={item.image} />
            </video>
              <Card.Footer>
                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [soldItems, setSoldItems] = useState([])
  const loadListedItems = async () => {
    // Load all sold items that the user listed
    const itemCount = await marketplace.itemCount()
    let listedItems = []
    let soldItems = []
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx)
      if (i.seller.toLowerCase() === account) {
        // get uri url from nft contract
        const uri = await nft.tokenURI(i.tokenId)
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(uri)
        const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemId)
        console.log(metadata);
        // define listed item object
        let item = {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          name: metadata.name,
          description: metadata.description,
          assetUrl: metadata.assetUrl,
          assetType: metadata.assetType
        }
        listedItems.push(item)
        // Add listed item to sold items array if sold
        if (i.sold) soldItems.push(item)
      }
    }
    setLoading(false)
    setListedItems(listedItems)
    setSoldItems(soldItems)
  }
  useEffect(() => {
    loadListedItems()
  }, [])

  const renderAsset = (item) => {
    if (!item || !item.assetType) {
      return null;
    }
    // changing https://ipfs.io/ipfs/QmZ8SXYrmtovrmEZHZZdvjN17etmK8uTsXK1v3cNE6E96t
    // to https://ipfs.moralis.io:2053/ipfs/QmZ8SXYrmtovrmEZHZZdvjN17etmK8uTsXK1v3cNE6E96t
    // since former is throwing frequent 504
    const assetUrl = item.assetUrl.replace('https://infura-ipfs.io/', 'https://ipfs.moralis.io:2053/');
    //const assetUrl = item.assetUrl.replace('https://infura-ipfs.io/', 'https://ipfs.io/');
    return (
      <div>
        {item.assetType.indexOf('image/') === 0 ? 
          <div><img src={assetUrl} alt="" /></div> 
        : null}
        {item.assetType.indexOf('video/') === 0 ? 
          <div>
            <video controls autoPlay width="260">
              <source src={assetUrl} type={item.assetType} />
              Your browser does not support the video tag.
            </video>
          </div> 
        : null}
      </div>
    )
  }

  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ?
        <div className="px-5 py-3 container">
            <h2>Listed</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Body>
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>
                      {item.description}
                    </Card.Text>
                    {renderAsset(item)}
                  </Card.Body>
                  <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
            {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}
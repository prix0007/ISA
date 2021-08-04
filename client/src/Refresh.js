import React from 'react'

const Refresh = () => {
    const reload = () => {
        window.location.reload();
    }
    return (
        <div>
            <p>Looks like somethings can't be loaded at the moment. Try Refreshing</p>
            <button className="button is-primary" onClick={() => reload()}>
                <ion-icon name="refresh-circle-outline"></ion-icon>
                Refresh
            </button>
        </div>
    )
}

export default Refresh
